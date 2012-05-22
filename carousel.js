
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

var Carousel = function (carouselContainingDiv, scrollingDelay) {	
	'use strict';
	
	this.m_carouselContainingDiv = carouselContainingDiv;	
	this.m_scrollingDelay = scrollingDelay;
	
	var scrollAreas = this.m_carouselContainingDiv.ownerDocument.getElementsByClassName('carousel_scroll_area');
	if (scrollAreas.length > 1) {
		throw "There should be only one element with classname carousel_scroll_area within a given carousel.";
	}
	
	this.m_scrollArea = scrollAreas[0];
		
	this.m_nbCapsules = this.GetNbCapsules();
	this.m_idxCurrentCapsule = 0;	
	
	this.RefreshCapsulesDimensions();

	window.addEventListener('resize', this.HandleWindowResize.bind(this), false);	
	window.addEventListener('load', this.HandleWindowLoaded.bind(this), false);
}

Carousel.prototype.HandleWindowResize = function HandleWindowResizeFunction(event) {
	this.RefreshCapsulesDimensions();
	this.RefreshFontSizes();
}

Carousel.prototype.HandleWindowLoaded = function HandleWindowLoadedFunction(event) {
	this.RefreshCapsulesDimensions();
	this.RefreshFontSizes();
}

Carousel.prototype.ScrollRight = function ScrollRightFunction() {
	'use strict';
	
	this.RefreshCapsulesDimensions();
	
	this.m_idxCurrentCapsule = (this.m_idxCurrentCapsule + 1) % this.m_nbCapsules;
	var newLeftPos = '-' + parseInt(this.m_capsuleWidth * this.m_idxCurrentCapsule) + 'px';
	this.m_scrollArea.style.left = newLeftPos;
};

Carousel.prototype.Start = function StartFunction(scrollingDelayOverride) {
	'use strict';
	
	this.intervalId = setInterval(this.ScrollRight.bind(this), scrollingDelayOverride || this.m_scrollingDelay);
};

Carousel.prototype.GetNbCapsules = function GetNbCapsulesFunction() {
	'use strict';
	
	return this.GetCapsules().length;
};

Carousel.prototype.GetCapsules = function GetCapsulesFunction() {
	"use strict";
	
	return this.m_scrollArea.getElementsByClassName('carousel_capsule');
}

Carousel.prototype.RefreshCapsulesDimensions = function RefreshCapsulesDimensionsFunction() {
	'use strict';
	
	var capsules = this.GetCapsules();
	var capsuleImgs = capsules[0].getElementsByClassName('carousel_capsule_image');
	if (capsuleImgs.length > 1) {
		throw "There should be only one element with classname carousel_capsule_image within a given carousel_capsule element";
	}
	
	this.m_capsuleWidth = capsuleImgs[0].offsetWidth;
	this.m_capsuleHeight = capsuleImgs[0].offsetHeight;
	
	var newLeftPos = '-' + parseInt(this.m_capsuleWidth * this.m_idxCurrentCapsule) + 'px';
	this.m_scrollArea.style.left = newLeftPos;
}

/* ---------------------------------------------------------------------- */

/* Font scaling depending on capsules dimensions */

Carousel.prototype.RefreshFontSizes = function RefreshFontSizes() {
	var fontSize = parseInt(this.m_capsuleHeight * 0.05) + 'px';
	var capsules = this.GetCapsules();
	 for (var i = 0; i < capsules.length; i++) {
		capsules[i].style.fontSize = fontSize;
	 }
}

/* ---------------------------------------------------------------------- */
