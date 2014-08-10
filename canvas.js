function canvas(element) {
	this.element = element;
	this.context = element.getContext('2d');
	element.width = element.offsetWidth * canvas.retina;
	element.height = element.offsetHeight * canvas.retina;
}

canvas.retina = window.devicePixelRatio || 1;

canvas.prototype.transform = function(t) {
    this.context.translate(t.x, t.y);
    this.context.scale(t.scale, t.scale);
};

canvas.point = function(x, y) {
	this.x = x;
	this.y = y;
};

canvas.point.fromPolar = function(r, theta) {
	return new canvas.point(
		r * Math.sin(theta),
		r * Math.cos(theta)
	);
};

canvas.point.prototype.polar = function() {
	return {
		r: Math.sqrt(this.x * this.x + this.y * this.y),
		theta: Math.atan2(this.y, this.x); // TODO - check
	};
};

canvas.polygon = function(radius, sides) {
    var dTheta = Math.PI * 2 / sides,
    	theta = (sides % 2) ? dTheta / 2 : 0,
    	corners = [];
    for (var i = 0; i < sides; ++i)
    	corners.push(canvas.point.fromPolar(radius, theta += dTheta))
    return corners;
};

canvas.transform = function(scale, x, y) {
	this.scale = scale;
	this.x = x;
	this.y = y;
};

canvas.transform.prototype.inv = function() {
	return new canvas.transform(
		1 / this.scale,
		-this.x / this.scale,
		-this.y / this.scale
	);
};

canvas.transform.prototype.apply = function(p) {
	return new canvas.point(
		p.x * this.scale + this.x,
		p.y * this.scale + this.y
	);
};