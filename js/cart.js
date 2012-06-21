var Sandbox = function() {
	var _d = window.document;

	return {

		find : function(id) {
			var tagId = typeof id !== undefined ? _d.getElementById(id) : null;
			return tagId;
		},

		addEvent : function(who, event, callback) {
			core.dom.bind(who, event, callback);
		},

		removeEvent : function(who, event, callback) {
			core.dom.unbind(who, event, callback);
		},
		notify : function(options) {
			core.triggerEvent(options);
		},

		listen : function(options) {
			core.registerEvents(options);
		},

		ignore : function(options) {
			core.removeEvents(options);
		},

		createElement : function(el, config) {
			var i, text;
			el = core.dom.create(el);
			if (config) {
				if (config.children && core.is_arr(config.children)) {
					i = 0;
					while (config.children[i]) {
						el.appendChild(config.children[i]);
						i++;
					}
					delete config.children;
				} else if (config.text) {
					text = document.createTextNode();
					delete config.text;
					el.appendChild(text);
				}

				core.dom.apply_attrs(el, config);
			}
			return el;
		}
	};

};

// input, button, reset

CORE.createModule("search-box", function() {

	var _input, _button, _reset;

	var options = {
		"input" : "",
		"button" : "",
		"reset" : ""
	};
	var sb = new Sandbox();

	return {
		init : function(id) {
			_input = sb.find(options.input);
			_button = sb.find(options.button);
			_reset = sb.find(options.reset);

			sb.addEvent(_button, 'click', this.handleSearch);
			sb.addEvent(_reset, 'click', this.quitSearch);
		},
		destroy : function() {
			_input = null;
			_button = null;
			_reset = null;

			sb.removeEvent(_button, 'click', this.handleSearch);
			sb.removeEvent(_reset, 'click', this.quitSearch);

		},

		handleSearch : function() {
			var query = _input.value;
			if (query) {
				sb.notify({
					type : 'perform-search',
					data : query
				});
			}

		},
		quitSearch : function() {
			input.value = "";
			sb.notify({
				type : 'quit-search',
				data : null
			});
		}
	};
});

CORE.createModule("filter-bar", function(sb) {
	var filters;

	return {
		init : function() {
			filters = sb.find('a');
			sb.addEvent(filters, 'click', this.filterProducts);
		},
		destroy : function() {
			sb.removeEvent(filters, 'click', this.filterProducts);
			filters = null;
		},
		filterProducts : function(event) {
			sb.notify({
				type : 'change-filter',
				date : event.currentTarget.innerHTML
			});
		}
	};
});

CORE.createModule("product-panel", function(sb) {
	var products;

	function eachProduct(func) {
		var i = 0, product;
		for (; product = products[i++]; ) {
			func(product);
		}
	}

	function reset() {
		eachProduct(function(prodcut) {
			product.style.opacity = '1';
		});
	}

	return {
		init : function() {
			var that = this;
			products = sb.find('li');
			sb.listen({
				'change-filter' : this.changeFilter,
				'reset-filters' : this.reset,
				'perform-search' : this.search,
				'quit-search' : this.reset
			});

			eachProduct(function(product) {
				sb.addEvent(product, 'click', that.addToCart);
			});
		},
		reset : reset,
		destroy : function() {
			var that = this;
			eachProduct(function(product) {
				sb.removeEvent(product, 'click', that.addToCart)
			});

			sb.ignore(['change-filter', 'reset-filters', 'perform-search', 'quit-search']);
		},
		search : function(query) {
			reset();
			query = query.toLowerCase();
			eachProduct(function(product) {
				if (product.getElementsByTagName('p')[0].innerHTML.toLowerCase().indexOf(query) < 0) {
					product.style.opacity = '0.2';
				}

			})
		},
		changeFilter : function(filter) {
		},
		addToCart : function(event) {
			var li = event.currentTarget;
			sb.notify({
				type : 'add-item',
				data : {
					id : li.id,
					name : li.getElementByTagName('p')[0].innerHTML,
					price : parseInt(li.id, 10)
				}
			});
		}
	};
});

CORE.create_module("shopping-cart", function(sb) {
	var cart, cartItems;

	return {
		init : function() {
			cart = document.getElementByTagName('ul')[0];
			cartItems = {};
			sb.listen({
				'add-item' : this.addItem
			});
		},
		destory : function() {
			cart = null;
			cartItems = null;
			sb.ignore(['add-item']);

		},
		addItem : function(product) {
			var entry = sb.find("cart-" + product.id);
			if (entry) {
				entry.innerHTML = (parseInt(entry.innerHTML, 10) + 1);
				cartItems[product.id]++;
			} else {
				entry = sb.createElement('li', {
					id : "cart-" + product.id,
					children : [sb.createElement('span', {
						'class' : 'product_name',
						text : product.name
					}), sb.createElement('span', {
						'class' : 'quantity',
						text : '1'
					}), sb.createElement('span', {
						'class' : 'price',
						text : '$' + product.price.toFixed(2)
					})],
					'class' : 'cart_entry'
				});

				cart.appendChild(emtry);
				cartItems[productId] = 1
			}
		}
	}
});

var CORE = ( function() {
		var moduleData = {}, debug = true;

		return {
			createModule : function(moduleName, creator) {
				var temp;

				temp = creator(Sandbox.create(this, moduleName));

				moduleData[moduleName] = {
					create : creator,
					instance : null
				};

				temp = null;
			},

			debug : function(on) {
				debug = on ? true : false;
			},

			start : function(moduleName) {
				var mod = moduleData[moduleName];
				if (mod) {
					mod.instance = mod.create(Sandbox.create(this, moduleName));
					mod.instance.init();
				}
			},

			startAll : function() {
				var moduleName;
				for (moduleName in moduleData) {
					if (moduleData.hasOwnProperty(moduleName)) {
						this.start(moduleName);
					}
				};
			},

			stop : function(moduleName) {
				var data;
				if ( data = moduleData[moduleName] && data.instance) {
					data.instance.destroy();
					data.instance = null;
				}
			},

			stopAll : function() {
				var moduleName;
				for (moduleName in moduleData) {
					if (moduleData.hasOwnProperty(moduleName)) {
						this.stop(moduleName);
					}
				}
			},

			registerEvents : function(events, mod) {
				if (moduleData[mod]) {
					moduleData[mod].events = events;
				}
			},

			triggerEvent : function(event) {
				var mod;
				for (mod in moduleData) {
					if (moduleData.hasOwnProperty(mod)) {
						mod = moduleData[mod];

						if (mod.event && mod.events[event.type]) {
							mod.events[event.type](event.data);
						}
					}
				}
			},

			removeEvents : function(events, mod) {
				var i = 0, event;

				for (; event = events[i++]; ) {
					delete mod.events[event];
				}
			},

			log : function(severity, message) {
				if (debug) {
					console[(severity === 1) ? 'log' : (severity === 2) ? 'warn' : 'error'](message);
				}
			},

			dom : {
				query : function(selector, context) {
					var ret = {}, that = this, jqEls, i = 0;

					if (context && context.find) {
						jqEls = context.find(selector);
					} else {
						jqEls = document.getElementById(selector);
					}

					ret = jqEls.get();
					ret.length = jqEls.length;
					ret.query = function(sel) {
						return that.query(sel, jqEls);
					}
					return ret
				},

				bind : function(elemnt, event, callback) {
					if (typeof event === 'function') {
						callback = event;
						event = 'click';
					}
					// TODO
					jQuery(element).bind(event, callback);
				},

				unbind : function(elemnt, event, callback) {
					if (typeof event === 'function') {
						callback = event;
						event = 'click';
					}
					// TODO
					jQuery(element).unbind(event, callback);
				},
				
				create: function(element) {
					return document.createElement(element);
				},
				
				applyAttrs: function(element, attrs) {
					// TODO
					jQuery(element).attr(attrs);
				},
				
				isArr: function(arr) {
					return jQuery.isArray(arr);
				},
				
				isObj: function(obj) {
					return jQuery.isPlainObject(obj);
				}
			}
		};
	}());
