(function(exports) {
	function D(element) {
		return new DOM(element);
	}
	function DOM(element) {
		if (typeof element == 'string') {
			this.selector = element;
			element = document.querySelectorAll(element);
		}
		if (element instanceof NodeList && element.length == 1) {
			element = element[0];
		}
		this.element = element;
		this.events = [];
		this.mods = {};
	}
	DOM.prototype.addClass = function(className) {
		if (!this.hasClass(className)) {
			this.element.className = this.element.className + ' ' + className;
		}
	};
	DOM.prototype.removeClass = function(className) {
		var classes = this.element.className.split(' ');
		var index = classes.indexOf(className);
		if (index != -1) {
			classes.splice(index, 1);
			this.element.className = classes.join(' ');
		}
	};
	DOM.prototype.hasClass = function(className) {
		var classes = this.element.className.split(' ');
		return classes.indexOf(className) != -1;
	};
	/**
	 * Можно передать несколько типов события:
	 * D(selector).on('click', 'touchend', function(e) {});
	 *
	 * @param {String} eventType
	 * @param {Function} handler
	 */
	DOM.prototype.on = function(eventType, handler) {
		if (arguments.length > 2) {
			var args = [].slice.apply(arguments);
			handler = args.pop();
			for (var i = 0; i < args.length; i++) {
				this.on(args[i], handler);
			}
			return;
		}

		var that = this;
		
		function boundFn(e) {
			if (that.selector) {
				// тут массив будет начинаться на пустой элемент
				var selectors = that.selector.split('.');
				selectors.shift();
				var i = selectors.length;
				var target = D(e.target);
				while (i--) {
					if (!target.hasClass(selectors[i])) {
						return;
					}
				}
			} else if (e.target != that.element) {
				return;
			}
			handler(e);
		}

		this.events.push({
			type: eventType,
			handler: handler,
			boundFn: boundFn
		});

		document.body.addEventListener(eventType, boundFn);
	};
	DOM.prototype.off = function(eventType, handler) {
		if (arguments.length > 2) {
			var args = [].slice.apply(arguments);
			handler = args.pop();
			for (var i = 0; i < args.length; i++) {
				this.off(args[i], handler);
			}
			return;
		}

		for (var i = 0; i < this.events.length; i++) {
			var event = this.events[i];
			if (event.handler == handler &&
				event.type == eventType) {

				document.body.removeEventListener(eventType, event.boundFn);
				break;
			}
		}
	};
	DOM.prototype.mod = function(name, value) {
		switch (arguments.length) {
			case 0:
				return this.mods;
			case 1:
				return this.mods[name];
		}

		var mod = this.mods[name];
		if (mod != null) {
			// omit boolean values in class name
			var oldVal = typeof mod == 'boolean' ? '' : '_' + mod;
			var oldClassName = '_' + name + oldVal;
			this.removeClass(oldClassName);
		}
		
		this.mods[name] = value;
		var className = '_' + name + '_' + value;
		this.addClass(className);
	};

	exports.D = D;
})(window);