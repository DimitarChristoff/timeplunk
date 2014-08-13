;(function(factory){
	if (typeof define == 'function' && define.amd){
		define(['d3', 'jquery', 'd3-tip'], factory);
	} else {
		this.TimePlunk = factory(
			this.d3,
			this.jQuery
		);
	}
}).call(this, function(d3, $){
	/**
	 *
	 * @param {String|HTMLElement} element to bind to
	 * @param {Object} options
	 * @constructor
	 */
	function TimePlunk(element, options){
		this.options = $.extend({}, {
			// margins
			top: 0,
			bottom: 20,
			right: 0,
			left: 0,

			// base width/height
			width: 300,
			height: 90,

			interpolateMethod: 'linear',

			// xAxis
			maxTicks: 3,

			brushEvent: 'brushend',

			// date format
			dateFormat: '%d/%m/%y',

			// tooltip
			tooltipClass: 'd3-tip',
			tooltipsEnabled: true,
			tooltipFormat: function(d){
				return d.nice + ' <span style="color:red">' + d.y + '</span>';
			},

			onBrush: function(x, y){},

			// function that parses
			dataParser: null
		}, options);

		var o = this.options;

		// chart size
		this.width = o.width - o.left - o.right;
		this.height = o.height + o.bottom;

		this.svg = typeof element === 'object' ? element : d3.select(element);
		this.svg.attr('width', this.width + o.left + o.right)
			.attr('height', this.height + o.top + o.bottom);


		// series scaling
		var x = this.x = d3.time.scale().range([0, this.width]);
		var y = this.y = d3.scale.linear().range([this.height, 0]);

		this._setxaxis();

		// brush for selection
		this.brush = d3.svg.brush().x(x).on(o.brushEvent, this.onBrush.bind(this));

		// plot area
		this.area = d3.svg.area().interpolate(o.interpolateMethod).x(function(d){
			return x(d.x);
		}).y0(this.height).y1(function(d){
			return y(d.y);
		});

		// tooltip
		d3.tip && this.options.tooltipsEnabled && this.setTooltip();
	}

	/**
	 * Internal onBrush event handler that exports selected range
	 * @returns {TimePlunk}
	 */
	TimePlunk.prototype.onBrush = function(){
		var data = this.brush.empty() ? this.x.domain() : this.brush.extent();
		this.options.onBrush.apply(this, data);

		return this;
	};

	/**
	 *
	 * @returns {TimePlunk}
	 */
	TimePlunk.prototype.resetSelection = function(){
		d3.select('.brush').call(this.brush.clear());

		return this;
	};

	TimePlunk.prototype._setxaxis = function(){
		// legend
		this.xAxis || (this.xAxis = d3.svg.axis().scale(this.x).ticks(this.options.maxTicks).orient('bottom').tickFormat(d3.time.format(this.options.dateFormat)));
	};

	/**
	 * Used to enable tooltip if available
	 * @returns {TimePlunk}
	 */
	TimePlunk.prototype.setTooltip = function(){
		this.tip = d3.tip()
			.attr('class', this.options.tooltipClass)
			.offset([-10, 0])
			.html(this.options.tooltipFormat);

		this.svg.append('defs').append('clipPath')
			.attr('id', 'clip')
			.append('rect')
			.attr('width', this.width)
			.attr('height', this.height)
			.call(this.tip);

		return this;
	};

	/**
	 * Used to set series data and parses/mods the array.
	 * @param {Array} data
	 * @returns {TimePlunk}
	 */
	TimePlunk.prototype.setData = function(data){
		var o = this.options;
		this.data = o.dataParser ? o.dataParser(data) : data;
		this.x.domain(d3.extent(this.data.map(function(item){
			return item.x;
		})));

		this.y.domain([0, d3.max(this.data.map(function(item){
			return item.y;
		}))]);

		this.svg.selectAll('*').remove();
		this._setContext();
		return this;
	};

	TimePlunk.prototype._setContext = function(){
		var context = this.context,
			x = this.x,
			y = this.y,
			height = this.height,
			tip = this.tip;

		if (context) {
			context.remove();
			this._setxaxis();
		}
		context = this.context = this.svg.append('g')
			.attr('class', 'context');

		this.path = context.append('path')
			.datum(this.data)
			.attr('class', 'area')
			.attr('d', this.area); // .call(xAxis);

		context.append('g')
			.attr('class', 'x brush')
			.call(this.brush)
			.selectAll('rect')
			.attr('y', -1)
			.attr('height', this.height + 1);

		this.svg.append('g')
			.attr('class', 'x axis')
			.attr('transform', 'translate(0,' + this.height + ')');

		var bars = this.svg.selectAll('.bar')
			.data(this.data)
			.call(this.xAxis)
			.enter().append('rect')
			.attr('class', 'dot')
			.attr('x', function(d){
				return x(d.x);
			})
			.attr('width', 1)
			.attr('y', function(d){
				return y(d.y);
			})
			.attr('height', function(d){
				return height - y(d.y);
			});

		this.tip && bars.on('mouseover', tip.show)
						.on('mouseout', tip.hide);

		// x-axis text sideways
		context.append('g')
			.attr('class', 'x axis')
			.attr('transform', 'translate(0,' + height + ')')
			.call(this.xAxis);

		return this;
	};

	return TimePlunk;

});