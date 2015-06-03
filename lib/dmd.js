/*
The MIT License (MIT)

Copyright (c) 2015 Kimberly Horne

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

/**
 * Create a new dot matrix display on the provided canvas with the provided options.
 * Valid options:
 * 
 * dot_size : the size of each dot (in pixels)
 * refresh : the time between paint calls (in ms)
 * drawMode : either "circle" or "rectangle"
 * background : background fill style (see canvas.getContext("2d").fillStyle)
 * off : the fill style to use for off LEDs
 * 
 */
function DMD(canvas, config) {
	var dmd = this;
	config = config || {};
	dmd.canvas = canvas;
	dmd.context = canvas.getContext("2d");

	dmd.dot_size = config.dot_size || 20;
	dmd.dot_width = Math.floor(canvas.width / dmd.dot_size);
	dmd.dot_height = Math.floor(canvas.height / dmd.dot_size);

	dmd.refresh = config.refresh || 50;
	dmd.drawMode = config.drawMode || "circle";

	dmd.background = config.background || 'rgb(60,60,60)';
	dmd.off = config.off || 'rgb(50,50,50)';

	var data = new Array(dmd.dot_width * dmd.dot_height);

	var dirty = true;
	var dirtyIndicies = [];
	
	/**
	 * Clear the display.
	 */
	dmd.clear = function() {
		for (var i = 0; i < data.length; i++) {
			data[i] = dmd.off;
		}
		dirty = true;
	};

	/**
	 * Set a given led on. If color is omitted then the default 'off' color is
	 * used.
	 */
	dmd.set = function(x, y, color) {
		if (typeof color === 'object') {
			color = 'rgb(' + color.join() + ')';
		} else if (typeof color === 'undefined') {
			color = dmd.off;
		} else if (typeof color != 'string') {
			return;
		}
		data[y * dmd.dot_width + x] = color;
		dirtyIndicies.push(y * dmd.dot_width + x);
	};

	/**
	 * Draw a given shape. Shape is expected to be an array of arrays, with each
	 * top level array being a row and each item in the inner arrays being
	 * either 1 or 0 (corresponding to LEDs being on or off at that position in
	 * the row.)
	 * 
	 * Option is expected to be an object with the following (optional)
	 * properties:
	 * 
	 * color : the color for the shape. If color is omitted then the default
	 * 'off' color is used.
	 * 
	 * fill : boolean specifying whether or not off LEDs should alter the
	 * pre-existing LED state. Default is false.
	 */
	dmd.draw = function(x, y, shape, options) {
		var color = options.color;
		var forceFill = options.fill;
		var hasPrinted = false;
		for (var i = 0; i < shape.length; i++) {
			var row = shape[i];
			var paintingY = y + i;
			if (paintingY >= 0 && paintingY < dmd.dot_height) {
				if (typeof row === 'object') { // an array of arrays
					for (var j = 0; j < row.length; j++) {
						var paintingX = x + j;
						if (paintingX >= 0 && paintingX < dmd.dot_width) {
							var show = row[j] === 1;
							if (show || forceFill) {
								dmd.set(paintingX, paintingY, (show ? color : undefined));
								hasPrinted = true;
							}
						}
					}
				}
//				else if (typeof row === 'number') {
//					var value = row;
//					var paintingX = x;
//					while (value) {
//						if (paintingX >= 0 && paintingX < dmd.dot_width) {
//							var show = value & 1;
//							value = value >>> 1;
//							if (show || forceFill) {
//								dmd.set(paintingX, paintingY, (show ? color : undefined));
//								hasPrinted = true;
//							}
//							paintingX++;
//						}
//						else {
//							break;
//						}
//					}
//				}
			}
		}
		return hasPrinted;
	};

	/**
	 * Fill a rectangle at the given positon and with the given dimensions with
	 * the provided color. If color is omitted then the default 'off' color is
	 * used.
	 */
	dmd.fill = function(x, y, w, h, color) {
		for (var i = x; i < x + w; i++) {
			for (var j = y; j < y + h; j++) {
				dmd.set(i, j, color);
			}
		}
	};

	/**
	 * Draw an unfilled rectangle at the given positon and with the given
	 * dimensions with the provided color. If color is omitted then the default
	 * 'off' color is used.
	 */
	dmd.rect = function(x, y, w, h, color) {
		for (var i = x; i < x + w; i++) {
			for (var j = y; j < y + h; j++) {
				if (j == y || j == y + h - 1 || i == x || i == x + w - 1) {
					dmd.set(i, j, color);
				}
			}
		}
	};

	dmd.clear();

	var painter = function() {
		if (!dirty && !dirtyIndicies.length) {
			return;
		}
		
		if (dirty) {
			//full repaint 
			dmd.context.fillStyle = dmd.background;
			dmd.context.fillRect(0, 0, dmd.canvas.width, dmd.canvas.height);
		}
		
		var drawCircles = dmd.drawMode === "circle";
		var updateLed = function(i, flush) {
			var led = data[i];
			if (flush) {
				dmd.context.fillStyle = dmd.background;
				dmd.context.fillRect((i % dmd.dot_width) * dmd.dot_size, Math
						.floor((i / dmd.dot_width))
						* dmd.dot_size, dmd.dot_size, dmd.dot_size);
			}
			dmd.context.fillStyle = led;
			if (drawCircles) {
				dmd.context.beginPath();
				dmd.context.arc((i % dmd.dot_width) * dmd.dot_size
						+ dmd.dot_size / 2, Math.floor((i / dmd.dot_width))
						* dmd.dot_size + dmd.dot_size / 2, dmd.dot_size / 2.5,
						0, 2 * Math.PI);
				dmd.context.fill();
			} else {
				dmd.context.fillRect((i % dmd.dot_width) * dmd.dot_size, Math
						.floor((i / dmd.dot_width))
						* dmd.dot_size, dmd.dot_size, dmd.dot_size);
			}
		}
		
		if (dirty) {
			//full repaint
			for (var i = 0; i < data.length; i++) {
				updateLed(i);
			}
			dirty = false;
		}
		else {
			for (var i = 0; i < dirtyIndicies.length; i++) {
				var index = dirtyIndicies[i];
				updateLed(index, true);
			}
			dirtyIndicies.length = 0;
		}
	};

	/**
	 * Redraw timer.
	 */
	dmd.timer = window.setInterval(painter, dmd.refresh);
}

function DMDTextPrinter(dmd) {
	
	var updateFontData = function(characterFont) {
		var width = 0;
		for (var i = 0; i < characterFont.length; i++) {
			if (typeof characterFont[i] === 'object') {
				width = Math.max(width, characterFont[i].length);
			}
//			else if (typeof characterFont[i] === 'number') {
//				var n = characterFont[i];
//				var w = 0;
//				do {
//					w++;
//				} while (n = n >>> 1); //TODO: be smarter, Kimb
//				width = Math.max(width, w);
//			}
		}
		characterFont.width = width;
	}
	
	this.updateFont = function(font) {
		for (var i = 0; i < font.length; i++) {
			var characterFont = font[i];
			if (!characterFont.width) {
				updateFontData(characterFont);
			}
		}
	}
	
	this.print = function(x, y, text, options) {
		var currentX = x;
		var font = options.font;
		var color = options.color;
		var fill = options.fill;
		
		var drawOptions = {color:color, fill:fill};
		var printed = 0;
		for (var i = 0; i < text.length && currentX <= dmd.dot_width; i++) {
			var c = text.charAt(i);
			var characterFont = font[c];
			if (!characterFont) {
				console.log("Skipping character " + c);
			}
			else {
				if (!characterFont.width) {
					updateFontData(characterFont);
				}
				if (dmd.draw(currentX, y, characterFont, drawOptions)) {
					printed++;
				}
				currentX += characterFont.width + 1;
			}
		}
		
		return printed > 0;
	}
}
