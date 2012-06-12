/** 
 * Simple, standalone, lightweight and responsive carousel.
 * Code repository: xxx
 * Please contact Julien Gilli at julien dot gilli at gmail dot com or http://www.juliengilli.com/
 * if you have any question. Contributions, suggestions and questions are more than welcome!
 *
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <julien dot gilli at gmail dot com> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Julien Gilli
 * ----------------------------------------------------------------------------
 */ 
 
if (Function.prototype.bind === undefined) {
	Function.prototype.bind = function (objectToBind) {
		'use strict';
		
		if (typeof this !== "function") {
			throw new TypeError("Function.prototype.bind called on a target that is NOT callable!");
		}
		
		var boundFunction = function () {
			return this.apply(objectToBind, arguments);
		};
		
		return boundFunction;
	};
}

function EventSupported(eventName) {	
	var eventToTagNames = {
		'select':'input','change':'input',
		'submit':'form','reset':'form',
		'error':'img','load':'img','abort':'img'
	};
	
	var element = document.createElement(eventToTagNames[eventName] || 'div');
	eventName = (((eventName.substring(0, 2) === 'on') ? '' : 'on') + eventName).toLowerCase();
	var isEventSupported = (eventName in element) || (eventName in window);
	if (!isEventSupported) {
		element.setAttribute(eventName, 'return;');
		var type = typeof(element.getAttribute(eventName));
		isEventSupported = (type == 'function');
	}
	element = null;
	
	return isEventSupported;		
}

function IsVisible(elem) {
	if (window.getComputedStyle) {
		var computedStyle = window.getComputedStyle(elem, null);
	}
	
	if (computedStyle !== undefined)
	{
		return computedStyle.visibility !== 'hidden' && computedStyle.display !== 'none';
	}

	return false;
}

function SearchUp(elem, property, value) {
	while (elem !== undefined && elem !== null && elem.getAttribute && elem.getAttribute(property) !== value) {
		elem = elem.parentNode;
	}
	
	return elem;	
}

function SearchDown(elem, property, value) {
	var nodesToVisit = [elem];
	while (nodesToVisit.length > 0) {
		var currElem = nodesToVisit[0];
		if (currElem !== undefined && currElem !== null && 
			currElem instanceof Element && 
			currElem.getAttribute(property) === value) {
			return currElem;
		}
		
		nodesToVisit.shift();
		if (currElem.childNodes !== null) {
			nodesToVisit = nodesToVisit.concat(Array.prototype.slice.call(currElem.childNodes, 0));
		}
	}
	
	return null;	
}

var Carousel = function (carouselContainingDiv, scrollingDelay) {	
	'use strict';	
	
	var CreateLastCapsule = function(scrollArea) {
		// Creates the last capsule used to provide a seamless looping when
		// transitioning from the real last capsule to the first one, or vice versa
		var firstCapsule = SearchDown(scrollArea, 'class', 'carousel_capsule');
		if (firstCapsule !== null) {
			var clonedFirstCapsule = firstCapsule.cloneNode(true);
			scrollArea.appendChild(clonedFirstCapsule);
		}
	}
	
	this.m_carouselContainingDiv = carouselContainingDiv;	
	this.m_scrollingDelay = scrollingDelay;
	
	var scrollAreas = this.m_carouselContainingDiv.ownerDocument.getElementsByClassName('carousel_scroll_area');
	if (scrollAreas.length > 1) {
		throw "There should be only one element with classname carousel_scroll_area within a given carousel.";
	}
	
	this.m_scrollArea = scrollAreas[0];	
	
	CreateLastCapsule(this.m_scrollArea);
	
	var leftNav = this.m_carouselContainingDiv.ownerDocument.getElementsByClassName('carousel_control_left');
	if (leftNav.length > 1) {
		throw "There should be only one element with classname carousel_scroll_left within a given carousel.";
	}
	
	this.m_leftNav = leftNav[0];
	
	var rightNav = this.m_carouselContainingDiv.ownerDocument.getElementsByClassName('carousel_control_right');
	if (rightNav.length > 1) {
		throw "There should be only one element with classname carousel_scroll_right within a given carousel.";
	}
	
	this.m_rightNav = rightNav[0];	
	
	this.m_nbCapsules = this.GetNbCapsules();
	this.m_idxCurrentCapsule = 0;	
	
	this.SetCapsulesWidth();
	this.RefreshCapsulesActualDimensions();
	this.RefreshScrollAreaLeftPos();
	
	window.addEventListener('resize', this.HandleWindowResize.bind(this), false);	
	window.addEventListener('load', this.HandleWindowLoaded.bind(this), false);
	
	this.m_carouselContainingDiv.onmouseover = this.HandleOnMouseOver.bind(this);
	this.m_carouselContainingDiv.onmouseout = this.HandleOnMouseOut.bind(this);
	
	this.m_rightNav.onclick = this.ScrollRight.bind(this);
	this.m_leftNav.onclick = this.ScrollLeft.bind(this);
	
	this.m_transitionEndEventAvailable = EventSupported('webkitTransitionEnd');	
	if (this.m_transitionEndEventAvailable) {
		this.m_carouselContainingDiv.addEventListener('webkitTransitionEnd', this.HandleTransitionEnd.bind(this), false);
	}
}

Carousel.prototype.DisableScrollAreaTransitions = function() {
		this.m_scrollArea.style['-webkit-transition-duration'] = '0s';
};
	
Carousel.prototype.EnableScrollAreaTransitions = function() {
		// Setting this attribute to null deletes the override value setup using 
		// DisableScrollAreaTransitions, so it's set back to what specified in the CSS
		// file
		this.m_scrollArea.style['-webkit-transition-duration'] = null;
};

Carousel.prototype.HandleTransitionEnd = function HandleTransitionEndFunction(event) {
	if (this.m_idxCurrentCapsule === this.m_nbCapsules - 1) {
		this.DisableScrollAreaTransitions();
		this.m_idxCurrentCapsule = 0;				
		this.m_scrollArea.style.left = '0px';		
	}
};

Carousel.prototype.HandleOnMouseOver = function HandleOnMouseOverFunction(event) {			
	var relatedTarget = (event.relatedTarget) ? event.relatedTarget : event.fromElement;	
	if (relatedTarget !== undefined && !this.IsInsideCarousel(relatedTarget)) {			
		this.StopScrolling();
		
		if (!this.NavButtonsVisible()) {
			this.ShowNavButtons();
		}
	}
};

Carousel.prototype.NavButtonsVisible = function NavButtonsVisibleFunction() {
	return IsVisible(this.m_rightNav) && IsVisible(this.m_leftNav);
};

Carousel.prototype.IsInsideCarousel = function IsWithinScrollAreaFunction(elem) {
	var elemFound = SearchUp(elem, 'className', 'carousel');
	return elemFound !== null && elemFound !== undefined && elem.className === 'carousel';
};

Carousel.prototype.HandleOnMouseOut = function HandleOnMouseOutFunction(event) {	
	var relatedTarget = (event.relatedTarget) ? event.relatedTarget : event.toElement;	
	if (relatedTarget !== undefined && !this.IsInsideCarousel(relatedTarget)) {
		this.HideNavButtons();
		this.StartScrolling();
	}
};

Carousel.prototype.HandleWindowResize = function HandleWindowResizeFunction(event) {
	this.RefreshCapsulesActualDimensions();
	this.RefreshScrollAreaLeftPos();
	this.RefreshFontSizes();
};

Carousel.prototype.HandleWindowLoaded = function HandleWindowLoadedFunction(event) {
	this.m_scrollAreaTransitionTime = this.m_scrollArea.style['-webkit-transition-duration'];
	this.RefreshCapsulesActualDimensions();
	this.RefreshScrollAreaLeftPos();
	this.RefreshFontSizes();
};

Carousel.prototype.ScrollRight = function ScrollRightFunction() {
	'use strict';
	
	this.EnableScrollAreaTransitions();
	
	this.RefreshCapsulesActualDimensions();
	
	this.m_idxCurrentCapsule = (this.m_idxCurrentCapsule + 1) % this.m_nbCapsules;
	var newLeftPos = '-' + parseInt(this.m_capsuleWidth * this.m_idxCurrentCapsule) + 'px';
	this.m_scrollArea.style.left = newLeftPos;
};

Carousel.prototype.ScrollLeft = function ScrollLeftFunction() {
	'use strict';
	
	if (this.m_idxCurrentCapsule == 0) {
		this.DisableScrollAreaTransitions();
		this.m_idxCurrentCapsule = this.m_nbCapsules - 1;
		var newLeftPos = '-' + parseInt(this.m_capsuleWidth * this.m_idxCurrentCapsule) + 'px';
		this.m_scrollArea.style.left = newLeftPos;
		setTimeout(this.HandleScrollLeftFromFirstCapsule.bind(this), 0);
	} else {
		this.EnableScrollAreaTransitions();
		
		this.RefreshCapsulesActualDimensions();
		
		this.m_idxCurrentCapsule = Math.max(0, this.m_idxCurrentCapsule - 1);
		var newLeftPos = '-' + parseInt(this.m_capsuleWidth * this.m_idxCurrentCapsule) + 'px';
		this.m_scrollArea.style.left = newLeftPos;
	}
};

Carousel.prototype.HandleScrollLeftFromFirstCapsule = function() {
	this.ScrollLeft();	
};

Carousel.prototype.StartScrolling = function StartScrollingFunction(scrollingDelayOverride) {
	'use strict';
	
	this.StopScrolling();
	this.intervalId = setInterval(this.ScrollRight.bind(this), scrollingDelayOverride || this.m_scrollingDelay);
};

Carousel.prototype.StopScrolling = function StopScrollingFunction(scrollingDelayOverride) {
	'use strict';
	
	clearInterval(this.intervalId);
};

Carousel.prototype.ShowNavButtons = function ShowNavButtonsFunction() {
	'use strict';
	
	this.m_rightNav.style.visibility = 'visible';
	this.m_leftNav.style.visibility = 'visible';
};

Carousel.prototype.HideNavButtons = function HideNavButtonsFunction() {
	'use strict';
	this.m_rightNav.style.visibility = 'hidden';
	this.m_leftNav.style.visibility = 'hidden';
};

Carousel.prototype.GetNbCapsules = function GetNbCapsulesFunction() {
	'use strict';
	
	return this.GetCapsules().length;
};

Carousel.prototype.GetCapsules = function GetCapsulesFunction() {
	"use strict";
	
	return this.m_scrollArea.getElementsByClassName('carousel_capsule');
};

Carousel.prototype.SetCapsulesWidth = function SetCapsulesWidthFunction() {
	this.m_scrollArea.style.width = (100 * this.m_nbCapsules) + '%';
	var capsuleWidth = (100 / this.m_nbCapsules) + '%';
	var capsules = this.GetCapsules();
	for (var capsuleIndex = 0; capsuleIndex < capsules.length; ++capsuleIndex) {
		capsules[capsuleIndex].style.width = capsuleWidth;
	}
};

Carousel.prototype.RefreshCapsulesActualDimensions = function RefreshCapsulesActualDimensionsFunction() {
	'use strict';
	
	var capsules = this.GetCapsules();
	var capsuleImgs = capsules[0].getElementsByClassName('carousel_capsule_image');
	if (capsuleImgs.length > 1) {
		throw "There should be only one element with classname carousel_capsule_image within a given carousel_capsule element";
	}
	
	this.m_capsuleWidth = capsuleImgs[0].offsetWidth;
	this.m_capsuleHeight = capsuleImgs[0].offsetHeight;
};

Carousel.prototype.RefreshScrollAreaLeftPos = function RefreshScrollAreaLeftPosFunction() {
	'use strict';
	
	var newLeftPos = '-' + parseInt(this.m_capsuleWidth * this.m_idxCurrentCapsule) + 'px';
	this.m_scrollArea.style.left = newLeftPos;
};

/* ---------------------------------------------------------------------- */

/* Font scaling depending on capsules dimensions */

Carousel.prototype.RefreshFontSizes = function RefreshFontSizes() {
	var fontSize = parseInt(this.m_capsuleHeight * 0.05) + 'px';
	var capsules = this.GetCapsules();
	 for (var i = 0; i < capsules.length; i++) {
		capsules[i].style.fontSize = fontSize;
	 }
};

/* ---------------------------------------------------------------------- */
