---
layout: page
title: Julien Gilli's blog about Lua, C++, web development and other programming topics
---
{% include JB/setup %}

# Recent blog posts

<ul class="posts">
  {% for post in site.posts %}
    <li><span>{{ post.date | date_to_string }}</span> &raquo; <a href="{{ BASE_PATH }}{{ post.url }}">{{ post.title }}</a></li>
  {% endfor %}
</ul>




