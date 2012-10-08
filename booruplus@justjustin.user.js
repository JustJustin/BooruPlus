// ==UserScript==
// @id             BooruPlus@JustJustin
// @name           BooruPlus
// @version        .1
// @namespace      JustJustin.BooruPlus
// @author         JustJustin
// @description    Provides key based pool navigation, url tag removal, and other shortcuts.
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
		this.poolBrowse.init();
		this.paginationBind.init();
    },
	paginationBind: {
		nextURL: null,
		prevURL: null,
		init: function() {
			//Add binds to << and >> page buttons if they exist.
			var pagereg = /\/post\/index|\/pool\/index|\/pool\/show\//;
			if(pagereg.exec(location.pathname)) {
				console.log("Pagination Page");
				var links = $$base('.pagination a');
				for(var i = 0; i < links.length; ++i) {
					if(links[i].innerHTML == '&lt;&lt;') {
						this.prevURL = links[i].href;
					}
					if(links[i].innerHTML == '&gt;&gt;') {
						this.nextURL = links[i].href;
					}
				}
				
				document.addEventListener('keydown', this.keyHandler);
			}
		},
		keyHandler: function(e) {
			switch(e.keyCode) {
				case 39:
					BooruPlus.paginationBind.next();
					break;
				case 37:
					BooruPlus.paginationBind.prev();
					break;
				default:
					break;
			}
		},
		next: function() {
			if(this.nextURL) {
				window.location = this.nextURL;
			}
		},
		prev: function() {
			if(this.prevURL) {
				window.location = this.prevURL;
			}
		}
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
	poolBrowse: {
		currentPool: null,
		init: function() {
			var poolReg = /\/pool\/show\//;
			
			//Detect if we are in a pool
			if(poolReg.exec(location.pathname)) {
				this.poolPage();
			}
			
			//Detect if we are viewing a image
			else if(/post\/show\//.exec(location.pathname)){
				this.poolImage();
				document.addEventListener('keydown', this.keyHandler);
			}
		},
		poolPage: function() {
			var id = parseInt(location.pathname.substr(location.pathname.lastIndexOf('/')+1));
			console.log("Pool " + id);
			this.currentPool = id;
			
			var links = $$base('#pool-show .thumb a');
			for(var i = 0; i < links.length; ++i) {
				links[i].addEventListener('click', function() {
					BooruPlus.poolBrowse.savePool();
					return true;
				});
			}
		},
		poolImage: function() {
			//Detect if we are viewing a pool post
			var pools = [];
			var els = $$base('.status-notice');
			for(var i = 0; i < els.length; ++i) {
				if(els[i].id.search('pool') != -1) {
					pools.push(els[i]);
					//Attach click event handlers only happens for pools
					var links = $$base('a', els[i]);
					for(var n = 0; n < links.length; ++n) {
						links[n].addEventListener('click', this.browseClick);
					}
				}
			}
			//No Pools found.
			if(pools.length == 0) {
				return;
			}
			console.log('Pools Image');
			console.log(pools);
			
			//Set currentPool based on localStorage if it is present 
			if(localStorage.getItem('browsePool')) {
				try{
					this.currentPool = JSON.parse( localStorage.getItem('browsePool') );
					if($base('#pool' + this.currentPool)) {
						console.log("Loaded saved Pool " + this.currentPool);
						return;
					}
				}
				catch(e){}
			}
			//Set currentPool to first pool availabe
			this.currentPool = this.getID(pools[0]);
			console.log("Selected Pool " + this.currentPool);
		},
		browseClick: function(e) {
			if(this.href.search('post') != -1) {
				BooruPlus.poolBrowse.savePool(BooruPlus.poolBrowse.getID(this.parentNode));
			}
		},
		getID: function(pool) {
			return parseInt(pool.id.substring(4));
		},
		savePool: function(poolID) {
			if(poolID != undefined) {
				this.currentPool = poolID;
			}
			localStorage.setItem('browsePool', JSON.stringify(this.currentPool));
			console.log("Saved " + this.currentPool);
		},
		keyHandler: function(e) {
			switch(e.keyCode) {
				case 39: 
					BooruPlus.poolBrowse.next();
					break;
				case 37:
					BooruPlus.poolBrowse.prev();
					break;
				default:
					break;
			}
		},
		next: function() {
			if(!this.currentPool) {
				return false;
			}
			var els = $$base('#pool' + this.currentPool + ' a');
			for(var i = 0; i < els.length; ++i) {
				if(els[i].innerHTML == '&gt;&gt;') {
					this.savePool();
					window.location = els[i].href;
				}
			}
		},
		prev: function() {
			if(!this.currentPool) {
				return false;
			}
			var els = $$base('#pool' + this.currentPool + ' a');
			for(var i = 0; i < els.length; ++i) {
				if(els[i].innerHTML == '&lt;&lt;') {
					this.savePool();
					window.location = els[i].href;
				}
			}
		}
	}
});

BooruPlus.init();