$(function() {

    var birthday = null;
    var planets = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
    var periods = [87.969, 224.701, 365.256, 686.980, 4332.589, 10759.22, 30685.4, 60189 ];
    // speed things up
    for (var i = 0; i < periods.length; i++) {
        periods[i] /= 1;
    }
    var birthdays = [];
    var d_birthdays = {};
    var all_dates = [];
    var year = moment().year();
    var num_years = 20;
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
    create_layout();
    $('#datepicker').datepicker({
        format: 'yyyy-mm-dd'
    });
    // Instantiate a slider
    var yearSlider = $("#yearSlider").slider({
        min: 1900,
        max: 2100,
        value: moment().year(),
        labelledby: 'sliderlabel'
    });

    // Monitoring
    function set_date(input) {
        var new_birthday = moment(input);
        if (birthday == null || !new_birthday.isSame(birthday)) {
            birthday = new_birthday;
            yearSlider = $("#yearSlider").slider({
                min: birthday.year(),
                max: birthday.year() + num_calc,
                value: moment().year(),
                labelledby: 'sliderlabel'
            });
            $('#yearSlider').slider('refresh', { useCurrentValue: true });
            year = moment().year();
            set_birthday(birthday);
        }
    }
    $("#datepicker").on("change", function() {
        var input = $("#datepicker")[0].value;
        searchParams.set("date", input);
        url.search = searchParams.toString();
        var str = url.toString();
        console.log(str);
        // change the search property of the main url
        window.history.replaceState({}, null, str);
        set_date(input);
    });
    $("#yearSlider").on("change", $.debounce(200, function() {
        year = yearSlider.slider('getValue');
        create_layout()
    }));


    // Creation
    function create_layout() {
        var elem = $("#output");
        elem.empty();
        for (var i = 0; i < num_years; i++) {
            elem.append(get_year_div(year + i));
        }
        $('[data-toggle="popover"]').popover({
            html:true
        });
        display_birthdays(birthday);
    }

    function set_birthday(date) {
        if (date == null) {
            return;
        }
        birthdays = [];
        d_birthdays = {};
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
                best_key = all_dates[i]
                break;
            }
        }
        console.log(best_key, best_num, d_birthdays[best_key]);
        display_birthdays();
    }

    function display_birthdays() {
        set_planet_classes();
    }

    function set_planet_classes() {
        var elements = $('.day');
        for (var i = 0; i < elements.length; i++) {
            var day = elements[i].getAttribute("day");
            var planets = d_birthdays[day];
            elements[i].className = "day " + day;
            if (planets != undefined) {
                var c = "";
                for (var j = 0; j < planets.length; j++) {
                    c += " " + planets[j];
                    if (j != 0) {
                        c += j
                    }
                }
                if (planets.length > 1) {
                    c += " doubleup"
                }
                elements[i].className += c;
                elements[i].setAttribute("data-content", day + "<br />Birthday on " +  planets.join(", ") + "!");
            } else {
                elements[i].setAttribute("data-content", day);
            }
        }
    }

    function get_year_div(year) {
        var div_year = document.createElement("div");
        var title = document.createElement("h2");
        title.innerHTML =year;
        div_year.appendChild(title);
        div_year.className = "year";
        var num_days = moment().year(year).isLeapYear() ? 366 : 365;
        for (var i = 1; i <= num_days; i++) {
            var day = moment().year(year).dayOfYear(i);
            if (day.month() != 0 && day.date() == 1) {
                var spacer = document.createElement("div");
                spacer.className = "spacer";
                div_year.appendChild(spacer);
            }
            var cls = day.format("YYYY/MM/DD");
            var day_elem = document.createElement("div");
            day_elem.setAttribute("day", cls);
            day_elem.setAttribute("data-toggle", "popover");
            day_elem.setAttribute("data-placement", "top");
            day_elem.setAttribute("data-trigger", "hover");
            day_elem.setAttribute("data-html", "trues");
            day_elem.setAttribute("data-content", cls);
            // var plans = cls in d_birthdays ? d_birthdays[cls] : [];
            day_elem.className = "day " + cls + " " ;//+ plans.join(" ");
            // day_elem.innerHTML = cls;
            div_year.appendChild(day_elem);
        }
        return div_year;
    }



});


