queue()
    .defer(d3.json, "data.json")
    .await(draw_venn);

function draw_venn(error, data) {


    var width = 700,
        height = 600,
        padding = 6, // separation between nodes
        minRadius = 30,
        maxRadius = 30,
        m = 3; // number of node clusters

    var color = d3.scale.ordinal() // colorbrewer['RdYlBu']['11']
        .domain(d3.range(m))
        .range(colorbrewer['YlGnBu']['3']);

    var x = d3.scale.ordinal()
        .domain(d3.range(m))
        .rangePoints([0, width], 1);
    var xVenn = d3.scale.ordinal()
        .domain(d3.range(m - 1))
        .rangePoints([0, width], 1);

    var nodes = d3.range(data.length).map(function(i) {

        var set = data[i].set;
        var ret = {
            radius: getRandomInt(minRadius, maxRadius),
            color: color(set),
            set: set,
            cx: x(set),
            cy: height / 2,
            name: data[i].name
        };
        return ret;
        f
    });

    var radiusScale = d3.scale.linear()
        .domain([0, d3.max(nodes, function(d) {
            return d.radius
        })])
        .range([minRadius, maxRadius]);

    var force = d3.layout.force()
        .nodes(nodes)
        .size([width, height])
        .gravity(0)
        .charge(0)
        .on("tick", tick)
        .on('end', function() {
            // layout is done
            placeVenn();
        })
        .start();

    var svg = d3.select("#chart").append("svg")
        .attr("width", width)
        .attr("height", height);

    var venn = d3.range(m - 1).map(function(i) {
        return {
            radius: Math.sqrt(50) * maxRadius,
            color: color(i),
            cx: x(i),
            cy: height / 2,
            set: i
        };
    });

    var vennCircles = svg.selectAll("g.vennCircle")
        .data(venn)
        .enter()
        .append('g')

    var vennCircle = vennCircles.append("circle")
        .attr("r", function(d) {
            return width / 3;
        })
        .style("fill", function(d) {
            return d.color;
        })
        .attr("transform", function(d, i) {
            return "translate(" + xVenn(i) + "," + height / 2 + ")";
        });


    var vennText = vennCircles.append("text")
        .text(function(d) {
            if (d.set == 0) {
                return "Extra ingredients you have";
            } else {
                return "Ingredients you need";
            }
        })
        .style("font-size", function(d) {
            return "20px";
        })
        .attr("dy", ".35em")
        .attr("transform", function(d, i) {
            return "translate(" + xVenn(i) + "," + 40 + ")";
        });


    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            var format = d3.format(".3s")
            return "<strong>" + d.name + ":</strong> <span style='color:red'>" + format(parseFloat(d.set)) + "</span>";
        })

    svg.call(tip);

    var gnodes = svg.selectAll("g.gnode")
        .data(nodes)
        .enter()
        .append('g')
        .attr("class", function(d) {
            return "gnode " + d.set;
        })
        .on("mouseover", function(d) {
            var currentFontSize = d3.select(this)
                .selectAll('text')
                .style('font-size');
            currentFontSize = parseFloat(currentFontSize);
            d3.select(this)
                .selectAll('text')
                .transition()
                .duration(100)
                .text(function(d) {
                    return d.name.replace(/\(.*?\)/, "");
                })
                .style('font-size', function() {
                    return "18px"
                });
        })
        .on("mouseout", function(d) {
            resetHighlighting();
        })
        .call(force.drag);

    function resetHighlighting() {

        d3.selectAll('.gnode text')
            .transition()
            .duration(100)
            .style('font-size', function(d) {
                return d.computedFontSize;
            });
    }

    var circle = gnodes.append("circle")
        .attr("r", function(d) {
            return d.radius;
        })
        .style("fill", function(d) {
            return d.color;
        })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

    var labels = gnodes.append("text")
        .text(function(d) {
            return d.name;
        })
        .style("font-size", function(d) {
            d.computedFontSize = Math.min(2 * d.radius, (2 * d.radius - 8) / this.getComputedTextLength() * 24);
            return d.computedFontSize + "px";
        })
        .attr("dy", ".35em");



    function placeVenn() {
        var group0_left,
            group0_right,
            group1_left,
            group1_right,
            group2_left,
            group2_right;

        gnodes.each(function(d) {
            var bb = this.getBoundingClientRect();
            if (d.set == 1) {
                if (!group1_left || bb.left < group1_left) group1_left = bb.left;
                if (!group1_right || bb.right > group1_right) group1_right = bb.right;
            } else if (d.set == 2) {
                if (!group2_left || bb.left < group2_left) group2_left = bb.left;
                if (!group2_right || bb.right > group2_right) group2_right = bb.right;
            } else if (d.set == 0) {
                if (!group0_left || bb.left < group0_left) group0_left = bb.left;
                if (!group0_right || bb.right > group0_right) group0_right = bb.right;
            }
        });


        vennCircle.each(function(d) {
            d3.select(this)
                // .transition()
                // .duration(500)
                .attr("r", function(d, i) {
                    var leftR = (group1_right - group0_left) / 2;
                    var rightR = (group2_right - group1_left) / 2;
                    return Math.max(leftR, rightR) + 10;
                })
                .attr("transform", function(d, i) {
                    if (d.set == 0) {
                        var xPos = group0_left + (group1_right - group0_left) / 2;
                        return "translate(" + xPos + "," + height / 2 + ")";

                    } else if (d.set == 1) {
                        var xPos = group1_left + (group2_right - group1_left) / 2;
                        return "translate(" + xPos + "," + height / 2 + ")";

                    }
                });

        })
    }

    function tick(e) {
        gnodes
            .each(gravity(.2 * e.alpha))
            .each(collide(.5))
        gnodes.attr("transform", function(d) {
            return 'translate(' + [d.x, d.y] + ')';
        });


        placeVenn();
    }

    // Move nodes toward cluster focus.
    function gravity(alpha) {
        return function(d) {
            d.y += (d.cy - d.y) * alpha;
            d.x += (d.cx - d.x) * alpha;
        };
    }

    // Resolve collisions between nodes.
    function collide(alpha) {
        var quadtree = d3.geom.quadtree(nodes);
        return function(d) {
            var r = d.radius + maxRadius + padding,
                nx1 = d.x - r,
                nx2 = d.x + r,
                ny1 = d.y - r,
                ny2 = d.y + r;
            quadtree.visit(function(quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== d)) {
                    var x = d.x - quad.point.x,
                        y = d.y - quad.point.y,
                        l = Math.sqrt(x * x + y * y),
                        r = d.radius + quad.point.radius + (d.color !== quad.point.color) * padding;
                    if (l < r) {
                        l = (l - r) / l * alpha;
                        d.x -= x *= l;
                        d.y -= y *= l;
                        quad.point.x += x;
                        quad.point.y += y;
                    }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            });
        };
    }

}


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}