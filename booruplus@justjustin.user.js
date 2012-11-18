// ==UserScript==
// @id             BooruPlus@JustJustin
// @name           BooruPlus
// @version        1.0
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
		this.poolFavorites.init();
		this.postPlus.init();
    },
	postPlus: {
		state: false,
		bodies: null,
		init: function() {
			this.bodies = $$base('.note-body');
			if(this.bodies && this.bodies.length > 0) {
				document.addEventListener('keydown', this.keyHandle);
				//Dispatch a mouse enter and leave event so position is set
				this.setPositions();
			}
		},
		setPositions: function() {
			//Danbooru doesn't calculate locations for captions until mouseover
			//This triggers that so they will be in correct position for viewing all.
			var notes = document.querySelectorAll('.note-box');
			for(var i = 0; i < notes.length; ++i) {
				var mouseIn = document.createEvent('MouseEvent');
				mouseIn.initEvent('mouseover', true, true);
				
				var mouseOut = document.createEvent('MouseEvent')
				mouseOut.initEvent('mouseout', true, true);
				
				notes[i].dispatchEvent(mouseIn);
				notes[i].dispatchEvent(mouseOut);
			}
		},
		keyHandle: function(e) {
			if(e.target.tagName == 'INPUT') {
				return true;
			}
			var _this = BooruPlus.postPlus;
			switch(e.keyCode) {
				case 67:
					_this.toggle();
				default:
					return true;
			}
		},
		toggle: function() {
			if(this.state) {
				this.hideAll();
			} else {
				this.showAll();
			}
		},
		showAll: function() {
			for(var i = 0; i < this.bodies.length; ++i) {
				this.bodies[i].style.display = "block";
			}
			this.state = true;
		},
		hideAll: function() {
			for(var i = 0; i < this.bodies.length; ++i) {
				this.bodies[i].style.display = 'none';
			}
			this.state = false;
		}
	},
	paginationBind: {
		nextURL: null,
		prevURL: null,
		init: function() {
			//Add binds to << and >> page buttons if they exist.
			var pagereg = /\/post\/index|\/pool\/index|\/pool\/show\/|\/post\?tags/;
			if(pagereg.exec(location.href)) {
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
			if(e.target.tagName == 'INPUT') {
				return true;
			}
			switch(e.keyCode) {
				case 68:
				case 39:
					BooruPlus.paginationBind.next();
					break;
				case 65:
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
	poolFavorites: {
		currentPool: null,
		currentPoolTitle: null,
		faves: [],
		init: function() {
			var poolReg = /\/pool\/show\//;
			
			//Get Favorite pools from local storage
			if(localStorage.getItem('favePools')) {
				try{
					var favePools = localStorage.getItem('favePools');
					this.faves = JSON.parse(favePools);
				}
				catch(e){ 
					console.log("favePools: JSON Load Fail");
				}//Do nothing if it fails
			}
			
			//Detect if we are in a pool
			if(poolReg.exec(location.pathname)) {
				this.poolPage();
			}
			//Detect if we are viewing a image
			else if(/post\/show\//.exec(location.pathname)){
				this.poolImage();
			}
			//Detect if we are viewing the user page(For favorites display)
			else if(/user\/home/.exec(location.pathname)) {
				//Interestingly, if we go back to this page from pushState
				//we see what should be myPage. To fix this, we set the popstate handler
				window.addEventListener('popstate', this.stateHandle);
				this.userPage();
			}
			//Restore favorites if the history object requires it.
			else if(/user\/pool/.exec(location.pathname)) {
				this.restoreMyPage();
			}
			
			//Set Poolwatch parent to this for access to faves and other functions
			//PoolWatch watches favorites and notifies user of updates
			this.poolWatch.parent = this;
			this.poolWatch.init();
		},
		stateHandle: function() {
			console.log("PopState");
			if(/user\/home/.exec(location.pathname)) {
				//Location update
				window.location = location.pathname;
			}
			if(/user\/pools/.exec(location.pathname)) {
				BooruPlus.poolFavorites.myPage(true);
			}
		},
		poolPage: function() {
			//Get pool id
			var pool = parseInt(location.pathname.substr(location.pathname.lastIndexOf('/')+1));
			//Get Pool Title
			var poolTitle = $base('#pool-show h4').innerHTML;
			poolTitle = poolTitle.substr(poolTitle.indexOf('Pool: ') + 6).trim();
			//Set object variables
			this.currentPool = pool;
			this.currentPoolTitle = poolTitle;
			console.log("favePool[Pool] " + pool + " " + poolTitle);
			
			//Add favorite/unfavorite button
			var root = $base('#del-mode');
			var el = $base.el('a', {
					'class': 'faveLink',
					'href': '#',
					innerHTML: (this.getFave(pool)) ? 
						"Remove From Favorites" : "Add to Favorites"
				});
			$base.extend(el.style, {
				display: 'block',
				marginBottom: '10px'
			});
			
			el.addEventListener('click', this.handlePoolClick);
			$base.before(root, el);
		},
		handlePoolClick: function(e) {
			var _this = BooruPlus.poolFavorites;
			//Add/Remove from favorites.
			if(_this.getFave(_this.currentPool)) {
				_this.unFave(_this.currentPool);
			}
			else {
				_this.fave(_this.currentPool, _this.currentPoolTitle);
			}
			//Set Text in link
			this.innerHTML = (_this.getFave(_this.currentPool)) ? "Remove From Favorites" : "Add to Favorites";
			
			e.preventDefault();
			return false;
		},
		getPoolImageTitle: function(el) {
			var links = $$base('a', el);
			for(var i = 0; i < links.length; ++i) {
				if(links[i].innerHTML != '&gt;&gt;' && links[i].innerHTML != '&lt;&lt;') {
					return links[i].innerHTML;
				}
			}
			return false;
		},
		poolImage: function() {
			//Detect if we are viewing a pool post
			var pools = [];
			var els = $$base('.status-notice');
			for(var i = 0; i < els.length; ++i) {
				if(els[i].id.search('pool') != -1) {
					var id = parseInt(els[i].id.substring(4));
					var title = this.getPoolImageTitle(els[i]);
					//pools.push({id: id, title: title});
					
					//Attach favorite image
					
					var $el = $base.el('img', {
						pool: id, title: title,
						alt: (this.getFave(id)) ? "UnFavorite" : "Favorite",
						src: (this.getFave(id)) ? BooruPlus.faveImage: BooruPlus.unFaveImage
					});
					$el.style.cursor = 'pointer';
					$el.addEventListener('mouseover', this.faveImageOver);
					$el.addEventListener('mouseout', this.faveImageOut);
					$el.addEventListener('click', this.faveImageClick);
					$base.prepend(els[i], $el);
				}
			}
			//No Pools found.
			if(pools.length == 0) {
				return;
			}
			//console.log('FavePools[Posts]');
			//console.log(pools);
		},
		faveImageClick: function(e) {
			var _this = BooruPlus.poolFavorites;
			e.preventDefault();
			if(this.alt == "UnFavorite") {
				this.alt = "Favorite";
				this.src = BooruPlus.unFaveImage;
				_this.unFave(this.pool);
			} else {
				this.alt = "UnFavorite";
				this.src = BooruPlus.faveImage;
				_this.fave(this.pool, this.title);
			}
		},
		faveImageOut: function(e) {
			if(this.alt == 'Favorite') {
				this.src = BooruPlus.unFaveImage;
			} else {
				this.src = BooruPlus.faveImage;
			}
		},
		faveImageOver: function(e) {
			if(this.alt == 'Favorite') {
				this.src = BooruPlus.faveImage;
			} else {
				this.src = BooruPlus.unFaveImage;
			}
		},
		userPage: function() {
			var els = $$base('div.section .link-page li');
			var index;
			for(index = 0; index < els.length; ++index) {
				if(els[index].innerHTML.search('Favorites') != -1)
					break;
			}
			
			var $li = $base.el('li', {});
			var $el = $base.el('a', {
				href: '#',
				innerHTML: '» My Pools'
			});
			
			$el.addEventListener('click', this.myClick);
			
			$li.appendChild($el);
			$base.after(els[index], $li);
		},
		myClick: function(e) {
			e.preventDefault();
			BooruPlus.poolFavorites.myPage(false);
		},
		myPage: function(ignoreState) {
			if(ignoreState === null) {
				ignoreState = false;
			}
			
			if(ignoreState == false) {
				//Save current page look.
				var history = document.body.innerHTML;
				//Push new state to browser.
				window.history.pushState({html: history}, "My Pools", '/user/pools/');
			}
			// Removing Clear page
			var root = document.getElementById("content");
			while (root.firstChild) {
				root.removeChild(root.firstChild);
			}
			//Create Header and paragraph for page information
			var $el = $base.el('h2', {innerHTML: 'My Pools'});
			root.appendChild($el);
			
			$el = $base.el('p', {
				innerHTML: ""
			});
			root.appendChild($el);
			//Create list for pools
			$section = $base.el('div', {'class': 'section'});
			$list = $base.el('ul', {'class': 'link-page'});
			for(var i = 0; i < this.faves.length; ++i) {
				var $li = $base.el('li', {});
				$el = $base.el('a', {
					href: '/pool/show/' + this.faves[i].id,
					innerHTML: this.faves[i].title
				});
				$li.appendChild($el)
				$list.appendChild($li);
				
			}
			$section.appendChild($list);
			root.appendChild($section);
			//Little bit of fluff
			document.title = "My Pools";
		},
		restoreMyPage: function() {
			if( !history.state.html ) {
				console.log("No history state.");
				return;
			}
			//Restore html contents
			document.body.innerHTML = history.state.html;
			//Do myPage html fill
			this.myPage(true);
		},
		fave: function(poolID, poolTitle) {
			this.faves.push({id: poolID, title: poolTitle});
			this.save();
		},
		unFave: function(poolID) {
			var newFaves = [];
			for(var i = 0; i < this.faves.length; ++i) {
				if(this.faves[i].id != poolID) {
					newFaves.push(this.faves[i]);
				}
			}
			this.faves = newFaves;
			this.save();
		},
		save: function() {
			var save = JSON.stringify(this.faves);
			localStorage.setItem('favePools', save);
		},
		getFave: function(poolID) {
			for(var i = 0; i < this.faves.length; ++i) {
				if(poolID == this.faves[i].id) {
					return this.faves[i];
				}
			}
			return false;
		},
		poolWatch: {
			parent: null,
			pools: null,
			init: function() {
				//Fail if poolWatch is not properly set
				if(this.parent == null) {
					console.log("PoolWatch needs parent to be defined before calling init()");
					return false;
				}
				//Point pools to parent faves till we have a seperate watch handler
				this.pools = this.parent.faves;
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
			//Attach event handlers to thumb nails, if a thumb is clicked
			//save the pool id so it remember which pool to browse
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
			if(e.target.tagName == 'INPUT') {
				return true;
			}
			switch(e.keyCode) {
				case 68:
				case 39: 
					BooruPlus.poolBrowse.next();
					break;
				case 65:
				case 37:
					BooruPlus.poolBrowse.prev();
					break;
				case 83:
					window.scrollBy(0, 50);
					break
				case 87:
					window.scrollBy(0, -50);
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
	},
	faveImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAPCAYAAADtc08vAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTAw9HKhAAAAe0lEQVQ4T2P4//8/Ay6sIGX2H4TxqcGr+dcD5v8gjM8Q2hgAshFmOyFXoLgA5md0zciGoHuHAaYJm62EDALpARuASyEhcbABoCgixxCYV+BhQIohyOGAEYjEOBs5YVHPAIq9gCvxEEpUOAMROaDQDcEaiMgJClvmwSUPAPwoeOeKu90pAAAAAElFTkSuQmCC",
	unFaveImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAPCAYAAADtc08vAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTAw9HKhAAAAbklEQVQ4T2P4//8/Ay6sIGX2H4TxqcGrGaYRnyG0MQCbjbhcgeICQn7GJs8AEyQUWMgBiawHbAC+UCYUS2AvkGMITA88DEgxBFktRiAS8g66RdQzgGIv4Eo8hBIVzkBE1ohuCNZARE4c+FyDnhoBehGFy45tg8sAAAAASUVORK5CYII="
});

BooruPlus.init();