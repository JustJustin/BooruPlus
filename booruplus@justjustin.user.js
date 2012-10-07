// ==UserScript==
// @id             BooruPlus@JustJustin
// @name           BooruPlus
// @version        .01
// @namespace      JustJustin.BooruPlus
// @author         JustJustin
// @description    BooruPlus
// @include        http://danbooru.donmai.us/*
// @include        https://danbooru.donmai.us/*
// @run-at         document-end
// ==/UserScript==


$base = function(selector, root){
	if(root == null) {
		root = document.body;
	}
	return root.querySelector(selector);
};
$$base = function(selector, root){
	if(root == null) {
		root = document.body;
	}
	return root.querySelectorAll(selector);
};
$base.extend = function(object, data){
	var key, val;
	for(key in data){
		val = data[key];
		object[key] = val;
	}
};

$base.extend($base, {
	engine: /WebKit|Presto|Gecko/.exec(navigator.userAgent)[0].toLowerCase(),
	addClass: function(el, klass){
		el.classList.add(klass);
	},
	rmClass: function(el, klass){
		el.classList.remove(klass);
	},
	hasClass: function(el, klass){
		var i;
		for(i = 0; i < el.classList.length; ++i){
			if(el.classList[i] == klass){
				return true;
			}
		}
		return false;
	},
	attr: function(el, val) {
		var attributes = el.attributes;
		return (attributes[val] === undefined) ? false: attributes[val].value;
	},
	after: function(root, el) {
		if(root.nextSibling){
			return root.parentNode.insertBefore(el, root.nextSibling);
		}
		return root.parentNode.appendChild(el);
	},
	before: function(root, el) {
		return root.parentNode.insertBefore(el, root);
	},
	el: function(tagname, attrs) {
		var el = document.createElement(tagname);
		$base.extend(el, attrs);
		return el;
	},
	firstParent: function(root, tag, limit) {
		if(limit === 0) { return false; }
		if( root.parentNode.tagName.toLowerCase() == tag.toLowerCase() ) {
			return root.parentNode;
		}
		if(root.parentNode == document.body){
			return false;
		}
		return $base.firstParent(root.parentNode, tag, limit - 1);
	},
	remove: function(el) {
		return el.parentNode.removeChild(el);
	},
	log: function(obj, severe) {
		if(severe || config.debug) {
			console.log(obj); //This is going to fuck up horribly with regular firefox I think
			//TODO FIX ^^^
		}
	},
	prepend: function(base, el) {
		if(base.firstChild) {
			$base.before(base.firstChild, el);
		} else {
			base.appendChild(el);
		}
	},
	addStyle: function(css) {
		var style;
		style = $base.el('style', {
			textContent: css
		});
		document.head.appendChild(style);
		return style;
    }
});

var BooruPlus = {};

$base.extend(BooruPlus, {
    init: function() {
        this.urlShorten();
        this.keyBind();
    },
    urlShorten: function() {
     var reg = /post\/show\//;
     var url = window.location.pathname;
     
     if(reg.exec(url)) {
        var newreg = /\/[\d]{2,}/;
        var ret = newreg.exec(location.pathname);
        if(ret) {
            var pos = location.pathname.indexOf(ret[0]) + ret[0].length;
            window.history.replaceState({}, window.top, location.pathname.substr(0, pos));
        }
     }
    },
    keyBind: function() {
		var els = $$base('.status-notice a');
		var el = false;
		for(var i = 0; i < els.length; ++i) { 
			if(els[i].innerHTML == '&gt;&gt;') {
				el = els[i];
				break;
			}
		};
		if(el)
		{
			document.addEventListener('keydown', function(e) { 
				if(e.keyCode == 39) {
					location.href = el.href;
				}
			});
		}
    }
});

BooruPlus.init();