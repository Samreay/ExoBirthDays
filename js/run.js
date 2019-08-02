$(function() {

    var birthday = null;
    var planets = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
    var periods = [87.969, 224.701, 365.256, 686.980, 4332.589, 10759.22, 30685.4, 60189 ];
    var planet_colours = ["#BBBBBB", "#f5ad49", "#4eb6f2", "#f24d44", "#6e2314", "#16a52e", "#42edd4", "#1c28a6"];
    var birth_color = "#4eb6f2";
    // speed things up
    for (var i = 0; i < periods.length; i++) {
        periods[i] /= 1;
    }
    var birthdays = [];
    var d_birthdays = {};
    var y_birthdays = [];
    var all_years = [];
    var all_dates = [];
    var start_year = moment().year();
    var num_years = 100;
    var num_calc = 120;
    var best_key = null;
    var best_num = null;


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
    var header = 50;
    var spacing = 30;
    var year_colour = "#DDDDDD";
    var margins = 120;
    var cur_day_color = "#222222";
    var font_style = "16px Helvetica-Neue,Helvetica,Arial,sans-serif";

    draw();

    function draw() {
        var canvas = document.getElementById("canvas-output");
        var cc = $("#canvas-output");
        var c = canvas.getContext("2d");
        canvas.setAttribute('width', parseInt(cc.css('width')));
        canvas.setAttribute('height', parseInt(cc.css('height')));
        var w = canvas.width;
        var h = canvas.height;
        clear_canvas(c, w, h);
        draw_year_lines(c, w, h);
        draw_birthdays(c, w, h);
        draw_birth(c, w, h);
        draw_today(c, w, h);
    }

    function yh(y) {
        return header + spacing * (y - start_year)
    }
    function dw(ratio, w) {
        return margins + (w - 2 * margins) * ratio
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
        }
    }

    function get_planet_radius(index) {
        return 3 + 2 * index;
    }

    function draw_birthdays(c, w, h) {
        // For each planet
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

                c.beginPath();
                c.arc(dw(ratio, w), height, size, 0, 2 * Math.PI);
                c.fill();
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
        c.fillStyle = birth_color;
        c.fillText("You were born", dw(1.01, w), y + 5);
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
        c.font = font_style;
        c.fillStyle = cur_day_color;
        c.fillText("Here is today!", dw(1.01, w), y + 5);

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
            var num_iterations = parseInt(200 * 365 / periods[i]);
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
});


