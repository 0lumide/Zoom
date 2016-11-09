const zoom_class = 'zoom-element';

function Zoom(width, height) {
	this.maxWidth = width;
	this.maxHeight = height;
	this.resetState();
}

Zoom.prototype.setXTranslation = function(translation) {
	this.xTranslation = Math.min(Math.max(-50, translation), 50);
}

Zoom.prototype.setYTranslation = function(translation) {
	this.yTranslation = Math.min(Math.max(-50, translation), 50);
}

Zoom.prototype.setScale = function(scale) {
	if(scale < 1) {
		this.scale = 1;
	} else if(scale > 50) {
		this.scale = 50;
	} else {
		this.scale = scale;
	}
	this.translate(this._lastPercentX, this._lastPercentY);
}

Zoom.prototype.resetState = function() {
	this.scale = 1;
	this.xTranslation = 0;
	this.yTranslation = 0;
	this._lastPercentX = 0;
	this._lastPercentY = 0;
}

// percent is percentage that's displayed / inferred from the input
Zoom.prototype.translate = function(percentX, percentY) {
	this._lastPercentX = percentX;
	this._lastPercentY = percentY;
	// Since the image doesn't have a fixed size when the scale is 1
	// I calculate the what the size would be if scale was 1
	var height, width;
	var heightRatio = this.maxHeight / window.innerHeight;
	var widthRatio = this.maxWidth / window.innerWidth;
	if(heightRatio > widthRatio) {
		height = window.innerHeight;
		width = this.maxWidth * height / this.maxHeight;
	}else {
		width = window.innerWidth;
		height = this.maxHeight * width / this.maxWidth;
	}

	//correct for images smaller than the screen
	if(this.maxHeight < height && this.maxWidth < width) {
		width = this.maxWidth;
		height = this.maxHeight;
	}

	// Calculate scaled size;
	width *= this.scale;
	height *= this.scale;

	percentX = this.mapPercent(percentX);
	percentY = this.mapPercent(percentY);

	if(width > window.innerWidth) {
		var overflow = width - window.innerWidth;
		var scroll = percentX * overflow / 200;
		var scrollPercent = scroll * 100 / width;
		this.setXTranslation(-scrollPercent);
	} else {
		this.setXTranslation(0);
	}

	if(height > window.innerHeight) {
		var overflow = height - window.innerHeight;
		var scroll = percentY * overflow / 200;
		var scrollPercent = scroll * 100 / height;
		this.setYTranslation(-scrollPercent);
	} else {
		this.setYTranslation(0);
	}
}

Zoom.prototype.mapPercent = function(percent) {
	percent -= 50;
	var sign = 1;
	if(percent < 0) {
		sign = -1;
	}
	percent = Math.abs(percent);
	percent = Math.min(30, percent);
	percent = percent * 100 / 30;

	return sign * percent;
}

function Controller(image, zoom) {
	this._initCloseTarget ();
	if(image && zoom) {
		this.init(image, zoom);
	}
}

Controller.prototype.init = function(image, zoom) {
	this.zoom = zoom;
	this.image = image;
	this._translationListeners = [];
	this._scaleListeners = [];
	this._createScrollListener();
	this._createMouseListener();
	this._createZoomListener();
	this._createTranslateListener();
}

Controller.prototype._createZoomListener = function() {
	this.addScaleListener((scale) => {
		this.image.style.transform = `scale(${scale}) translate(${this.zoom.xTranslation}%, ${this.zoom.yTranslation}%)`;
	});
}

Controller.prototype._createTranslateListener = function() {
	this.addTranslationListener((xTranslation, yTranslation) => {
		this.image.style.transform = `scale(${this.zoom.scale}) translate(${xTranslation}%, ${yTranslation}%)`;
	});
}

Controller.prototype._createScrollListener = function() {
	this.image.addEventListener('wheel', (event) => {
		if(this.image.matches(".zoomed .Gallery-media .media-image")) {
			if(event.deltaY < 0) {
				this.zoomIn();
			} else if(event.deltaY > 0) {
				this.zoomOut();
			}
			return false;
		}
	}, false);
}

Controller.prototype._createMouseListener = function() {
	// Attach mouse position listener
	this.image.addEventListener('mousemove', (event) => {
		if(this.image.matches(".zoomed .Gallery-media .media-image")) {
			var x = event.clientX;
			var y = event.clientY;
			var w = window.innerWidth;
			var h = window.innerHeight;
			this.translate((100 * x)/w, (100 * y)/h);
		}
	}, false);
}

Controller.prototype.addScaleListener = function(listener) {
	this._scaleListeners.push(listener);
}

Controller.prototype.addTranslationListener = function(listener) {
	this._translationListeners.push(listener);
}

Controller.prototype._notifyScaleListeners = function() {
	if(this._scaleListeners) {
		this._scaleListeners.forEach((listener) => {
			listener(this.zoom.scale);
		});
	}
}

Controller.prototype._notifyTranslationListeners = function() {
	if(this._translationListeners) {
		this._translationListeners.forEach((listener) => {
			listener(this.zoom.xTranslation, this.zoom.yTranslation);
		});
	}
}

Controller.prototype._initCloseTarget = function() {
	var closeTarget = document.querySelector('.Gallery-closeTarget');
	closeTarget.addEventListener('click', (event) => {
		var gallery = document.querySelector('.Gallery');
		gallery.classList.remove('zoomed');
	});
}

Controller.prototype.zoomIn = function() {
	this.zoom.setScale(this.zoom.scale * 1.2);
	this._notifyScaleListeners();
}

Controller.prototype.zoomOut = function() {
	this.zoom.setScale(this.zoom.scale / 1.2);
	this._notifyScaleListeners();
}

// percent is percentage that's displayed / inferred from the input
Controller.prototype.translate = function(percentX, percentY) {
	this.zoom.translate(percentX, percentY);
	this._notifyTranslationListeners();
}

Controller.prototype.toggleZoom = function(){
	var gallery = document.querySelector('.Gallery');
	var isZoomed = gallery.classList.toggle('zoomed');
	if(!isZoomed) {
		var image = document.querySelector('.Gallery-media .media-image');
		image.style.transform = "";
		this.zoom.resetState();
	}
};

function ZoomButton() {
	this._createElements();
	this.node.addEventListener('click', () => {
		if(this._clickListeners) {
			this._notifyClickListeners();
		}
	});
}

ZoomButton.prototype.addClickListener = function(listener) {
	if(!this._clickListeners) {
		this._clickListeners = [];
	}
	this._clickListeners.push(listener);
}

ZoomButton.prototype._notifyClickListeners = function() {
	if(this._clickListeners) {
		this._clickListeners.forEach((listener) => {
			listener();
		});
	}
}

ZoomButton.prototype._createElements = function() {
	this.node = document.createElement('div');
	var button = document.createElement('button');
	var iconContainer = document.createElement('div');
	var icon = document.createElement('span');
	var tooltip = document.createElement('span');

	this.node.classList.add(zoom_class, 'ProfileTweet-action');
	button.classList.add('ProfileTweet-actionButton','u-textUserColorHover', 'js-actionButton');
	iconContainer.classList.add('IconContainer', 'js-tooltip');
	iconContainer.setAttribute('data-original-title', 'Zoom');
	icon.classList.add('Icon', 'Icon--zoom');
	tooltip.classList.add('u-hiddenVisually');
	tooltip.textContent = 'Zoom';

	iconContainer.appendChild(icon);
	iconContainer.appendChild(tooltip);
	button.appendChild(iconContainer);
	this.node.appendChild(button);
}

var controller = new Controller();

var buttonObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
		if(mutation.addedNodes && mutation.addedNodes.length > 0) {
			var zoomButton = new ZoomButton();

			zoomButton.addClickListener(() => {controller.toggleZoom()});

			var moreButton = document.querySelector('.Gallery .ProfileTweet-action--more');
			moreButton.parentNode.insertBefore(zoomButton.node, moreButton);
		};
  });
});

var buttonConfig = { attributes: false, childList: true, characterData: false };
var buttonTarget = document.querySelector('.GalleryTweet');
buttonObserver.observe(buttonTarget, buttonConfig);

var imageObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
		if(mutation.addedNodes && mutation.addedNodes.length > 0) {
			var image = document.querySelector('.Gallery-media .media-image');
			image.addEventListener('click', (event) => {controller.toggleZoom()});
			var zoom = new Zoom(image.naturalWidth, image.naturalHeight);
			controller.init(image, zoom);
			// TODO create slider button
		}
  });
});

var imageConfig = { attributes: false, childList: true, characterData: false };
var imageTarget = document.querySelector('.Gallery-media');
imageObserver.observe(imageTarget, imageConfig);
