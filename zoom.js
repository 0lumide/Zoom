const zoom_class = 'zoom-element';

function Zoom() {
	this.xTranslation = 0;
	this.yTranslation = 0;
	this.scale = 1;
}

Zoom.prototype.setXTranslation = function(translation) {
	this.yTranslation = Math.min(Math.max(-50, translation), 50);
}

Zoom.prototype.setYTranslation = function(translation) {
	this.yTranslation = Math.min(Math.max(-50, translation), 50);
}

Zoom.prototype.setScale = function(scale) {
	if(scale < 1) {
		this.scale = 1;
	} else {
		this.scale = scale;
	}
}

function Controller(width, height) {
	this.zoom = new Zoom();
	this.origWidth = width;
	this.origHeight = height;
}

Controller.prototype.addScaleListener = function(listener) {
	if(!this._scaleListeners) {
		this._scaleListeners = [];
	}
	this._scaleListeners.push(listener);
}

Controller.prototype.addTranslationListener = function(listener) {
	if(!this._translationListeners) {
		this._translationListeners = [];
	}
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

Controller.prototype.zoomIn = function() {
	this.zoom.setScale(this.zoom + 0.2);
	this._notifyScaleListeners();
}

Controller.prototype.zoomOut = function() {
	this.scale -= 0.2;
	this._notifyScaleListeners();
}

// percent is percentage that's displayed / inferred from the input
Controller.prototype.translate = function(percentX, percentY) {
	// Since the image doesn't have a fixed size when the scale is 1
	// I calculate the what the size would be if scale was 1
	var height, width;
	var heightRatio = this.origHeight / window.innerHeight;
	var widthRatio = this.origWidth / window.innerWidth;
	if(heightRatio > widthRatio) {
		height = window.innerHeight;
		width = this.origWidth * height / this.origHeight;
	}else {
		width = window.innerWidth;
		height = this.origHeight * width / this.origWidth;
	}

	// Calculate scaled size;
	width *= this.zoom.scale;
	height *= this.zoom.scale;

	percentX = this.mapPercent(percentX);
	percentY = this.mapPercent(percentY);

	if(width > window.innerWidth) {
		var overflow = width - window.innerWidth;
		var scroll = percentX * overflow / 200;
		var scrollPercent = scroll * 100 / width;
		this.zoom.setXTranslation(scrollPercent);
	}

	if(height > window.innerHeight) {
		var overflow = height - window.innerHeight;
		var scroll = percentY * overflow / 200;
		var scrollPercent = scroll * 100 / height;
		this.zoom.setYTranslation(scrollPercent);
	}

	this._notifyTranslationListeners();
}

Controller.prototype.mapPercent = function(percent) {
	percent -= 50;
	var sign = 1;
	if(percent < 0) {
		sign = -1;
	}
	percent = Math.abs(percent);
	percent = Math.max(5, percent);
	percent = percent * 100 / 45;

	return sign * percent;
}

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

function toggleZoom(){
	document.querySelector('.Gallery').classList.toggle('zoomed');
};

var buttonObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
		if(mutation.addedNodes && mutation.addedNodes.length > 0) {
			console.log('Added:');
			var zoomButton = new ZoomButton();

			zoomButton.addClickListener(toggleZoom);

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
			image.addEventListener('click', toggleZoom);
			var controller = new Controller(image.width, image.height);
		}
  });
});

var imageConfig = { attributes: false, childList: true, characterData: false };
var imageTarget = document.querySelector('.Gallery-media');
imageObserver.observe(imageTarget, imageConfig);
