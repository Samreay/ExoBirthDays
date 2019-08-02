$(function() {

    var birthday = null;
    var planets = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
    var periods = [87.969, 224.701, 365.256, 686.980, 4332.589, 10759.22, 30685.4, 60189 ];
    var planet_colours = ["#BBBBBB", "#f5ad49", "#4eb6f2", "#f24d44", "#6e2314", "#16a52e", "#42edd4", "#1c28a6"];
    var planet_color_dict = {};
    for (var i = 0; i < planet_colours.length; i++) {
        planet_color_dict[planets[i]] = planet_colours[i];
    }
    var birth_color = "#4eb6f2";
    // speed things up
    for (var i = 0; i < periods.length; i++) {
        periods[i] /= 1;
    }
    var birthdays = [];
    var d_birthdays = {};
    var coords_x = [];
    var coords_y = [];
    var coords_date = [];
    var all_dates = [];
    var start_year = moment().year();
    var num_years = 130;
    var num_calc = 120;
    var best_key = null;
    var best_num = null;

    var header = 50;
    var spacing = 30;
    var year_colour = "#DDDDDD";
    var year_colour2 = "#CCCCCC";
    var margin_left = 70;
    var margin_right = 70;
    var tooltip_width = 100;
    var cur_day_color = "#222222";
    var mega_birthday_color = "#f24d44";
    var font_style = "16px Helvetica-Neue,Helvetica,Arial,sans-serif";
    var canvas = document.getElementById("canvas-output");
    var canvasjq = $("#canvas-output");


    var searchParams = new URLSearchParams(window.location.search);
    var url = new URL(window.location.href);
    if (searchParams.has('date')) {
        var url_date = searchParams.get('date');
        var d = moment(url_date);
        if (d.isValid()) {
            $("#datepicker").val(d.format("YYYY-MM-DD"));
            set_date(d);
        }
    }
    // Setup
    var dp = $('#datepicker').datepicker({
        format: 'yyyy-mm-dd',
        showWeekDays: false,
        autoclose: true
    });
    dp.on("changeDate", function(e) {
        watch_date(e.date);
    });

    window.onresize = function() {
        draw();
    };

    // Monitoring
    function watch_date(input) {
        if (input == undefined) {
            input = $("#datepicker")[0].value;
        }
        if (!moment(input).isValid()) {
            return;
        }
        searchParams.set("date", moment(input).format("YYYY-MM-DD"));
        url.search = searchParams.toString();
        var str = url.toString();
        console.log(str);
        // change the search property of the main url
        window.history.replaceState({}, null, str);
        set_date(input);
    }
    function set_date(input) {
        var new_birthday = moment(input);
        if (birthday == null || !new_birthday.isSame(birthday)) {
            birthday = new_birthday;
            start_year = moment().year();
            set_birthday(birthday);
        }
    }
    $("#datepicker").on("change", function() {
        watch_date();
    });

    // Creation
    draw();

    canvasjq.mousemove(function(evt){
        var rect = canvas.getBoundingClientRect();
        pos = {
            x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
            y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
        };
        draw(pos);
    });

    function draw(pos) {
        var c = canvas.getContext("2d");
        canvas.setAttribute('width', parseInt(canvasjq.css('width')));
        canvas.setAttribute('height', parseInt(canvasjq.css('height')));
        var w = canvas.width;
        var h = canvas.height;
        clear_canvas(c, w, h);
        draw_year_lines(c, w, h);
        draw_birthdays(c, w, h);
        draw_birth(c, w, h);
        draw_today(c, w, h);
        draw_double_birthdays(c, w, h);
        if (!(pos == undefined)) {
            draw_tooltip(pos, c, w, h);
        }
    }

    function draw_double_birthdays(c, w, h) {
        var current_year = moment().year();
        for (var i = 0; i < all_dates.length; i++) {
            var d = all_dates[i];
            if (d in d_birthdays) {
                var p = d_birthdays[d];
                var num = p.length;
                if (num > 1) {
                    var y = moment(d).year();
                    if (y != current_year && y != birthday.year()) {
                        var text = "Double!";
                        if (num == 3) {
                            text = "Triple!";
                        }
                        if (num == 4) {
                            text = "MEGA!"
                        }
                        c.font = font_style;
                        c.textAlign = "left";
                        c.textBaseline = "middle";
                        c.fillStyle = planet_color_dict[p[p.length - 1]];
                        c.fillText(text, dw(1, w) + 10, yh(y));
                    }
                }
            }
        }
    }

    function draw_tooltip(pos, c, w, h) {
        var index = calc_close(pos);
        if (index != null) {
            var x = coords_x[index];
            var y = coords_y[index];
            var d = coords_date[index];
            var planets = d_birthdays[d];

            if (planets != undefined) {
                c.fillStyle = "#FFFFFF";
                c.strokeStyle = "#DDDDDD";
                c.lineWidth = 1;
                var height = (planets.length + 1) * 25;
                roundRect(c, x + 15, y - height * 0.5, tooltip_width, height, 5, true, true);
                c.textAlign = "center";
                c.textBaseline = "top";
                c.fillStyle = "#888888";
                c.font = "bold" + font_style;
                c.fillText(d, x + tooltip_width * 0.5 + 15, y - height * 0.5 + 5);
                for (var i = 0; i < planets.length; i++) {
                    c.fillStyle = planet_color_dict[planets[i]];
                    c.fillText(planets[i], x + tooltip_width * 0.5 + 15, y - height * 0.5 + 5 + (i + 1) * 20)
                }
            }
        }
    }

    function calc_close(pos) {
        var min_dist = 99999999;
        var dist = 0;
        var index = 0;
        for (var i = 0; i < coords_date.length; i++) {
            dist = Math.pow((coords_x[i] - pos.x), 2) + Math.pow((coords_y[i] - pos.y), 2);
            if (dist < min_dist) {
                min_dist = dist;
                index = i;
            }
        }
        if (min_dist < Math.pow(30, 2)) {
            return index;
        } else {
            return null;
        }
    }

    function yh(y) {
        return header + spacing * (y - start_year)
    }
    function dw(ratio, w) {
        return margin_left + (w - margin_left - margin_right) * ratio
    }

    function clear_canvas(c, w, h) {
        c.clearRect(0, 0, w, h);
    }

    function draw_year_lines(c, w, h) {
        for (var y = start_year; y < start_year + num_years; y++) {
            c.beginPath();
            c.moveTo(dw(0, w), yh(y));
            c.lineTo(dw(1, w), yh(y));
            c.strokeStyle = year_colour;
            c.lineWidth = 1;
            c.stroke();
            c.font = font_style;
            c.textAlign = "end";
            c.fillStyle = year_colour2;
            c.fillText(y, dw(0, w) - 10, yh(y) + 5);
        }
    }

    function get_planet_radius(index) {
        return 3 + 2 * index;
    }

    function draw_birthdays(c, w, h) {
        // For each planet
        coords_x = [];
        coords_y = [];
        coords_date = [];
        for (var i = planets.length - 1; i >= 0; i--) {
            var planet_colour = planet_colours[i];
            var size = get_planet_radius(i);
            c.fillStyle = planet_colour;

            var days = birthdays[i];
            for (var j = 0; j < days.length; j++) {
                var m = moment(days[j]);
                var y = m.year();
                var height = yh(y);
                var num_days = m.isLeapYear() ? 366 : 365;
                var cur_day = m.dayOfYear();
                var ratio = cur_day / num_days;
                var width = dw(ratio, w);
                c.beginPath();
                c.arc(width, height, size, 0, 2 * Math.PI);
                c.fill();
                coords_x.push(width);
                coords_y.push(height);
                coords_date.push(days[j].format("YYYY/MM/DD"));
            }
        }
    }

    function draw_birth(c, w, h) {
        var y = yh(birthday.year());
        var x = dw(birthday.dayOfYear() / (birthday.isLeapYear() ? 366 : 365), w);
        c.beginPath();
        c.strokeStyle = birth_color;
        c.arc(x, y, get_planet_radius(2), 0, 2 * Math.PI);
        c.lineWidth = 3;
        c.stroke();
        c.font = font_style;
        c.textAlign = "start";
        c.fillStyle = birth_color;
        c.fillText("Birth!", dw(1.01, w), y + 5);
    }

    function draw_today(c, w, h) {
        var y = yh(moment().year());
        var ratio = moment().dayOfYear() / (moment().isLeapYear() ? 366 : 365);
        var x = dw(ratio, w);
        c.beginPath();
        c.strokeStyle = cur_day_color;
        c.moveTo(x, y - spacing * 0.4);
        c.lineTo(x, y + spacing * 0.4);
        c.lineWidth = 3;
        c.stroke();
        c.textAlign = "start";
        c.font = font_style;
        c.fillStyle = cur_day_color;
        c.fillText("Today!", dw(1.01, w), y + 5);
    }

    function set_birthday(date) {
        if (date == null) {
            return;
        }
        birthdays = [];
        start_year = date.year();
        d_birthdays = {};
        all_dates = [];
        for (var i = 0; i < planets.length; i++) {
            var num_iterations = parseInt(400 * 365 / periods[i]);
            var planet = planets[i];
            var dates = [];
            for (var j = 1; j < num_iterations; j++) {
                if (planet == "Earth") {
                    var d = date.clone().add(j, 'y');
                } else {
                    var d = date.clone().add(j * periods[i], 'd');
                }
                dates.push(d);
                var key = d.format("YYYY/MM/DD");
                if (!(key in all_dates)) {
                    all_dates.push(key);
                }
                if (!(key in d_birthdays)) {
                    d_birthdays[key] = []
                }
                d_birthdays[key].push(planet);
            }
            birthdays.push(dates);
        }
        all_dates.sort();
        best_key = all_dates[0];
        best_num = d_birthdays[best_key].length;
        for (var i = 1; i < all_dates.length; i++) {
            var num = d_birthdays[all_dates[i]].length;
            if (num > 1) {
                console.log(all_dates[i], num, d_birthdays[all_dates[i]]);
            }
            if (num > best_num) {
                best_num = num;
                best_key = all_dates[i];
                break;
            }
        }
        console.log(best_key, best_num, d_birthdays[best_key]);
        draw();
    }
    function roundRect(c, x, y, width, height, radius, fill, stroke) {
        if (typeof stroke == 'undefined') {
            stroke = true;
        }
        if (typeof radius === 'undefined') {
            radius = 5;
        }
        if (typeof radius === 'number') {
            radius = {tl: radius, tr: radius, br: radius, bl: radius};
        } else {
            var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
            for (var side in defaultRadius) {
                radius[side] = radius[side] || defaultRadius[side];
            }
        }
        c.beginPath();
        c.moveTo(x + radius.tl, y);
        c.lineTo(x + width - radius.tr, y);
        c.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        c.lineTo(x + width, y + height - radius.br);
        c.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        c.lineTo(x + radius.bl, y + height);
        c.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        c.lineTo(x, y + radius.tl);
        c.quadraticCurveTo(x, y, x + radius.tl, y);
        c.closePath();
        if (fill) {
            c.fill();
        }
        if (stroke) {
            c.stroke();
        }

    }
});


