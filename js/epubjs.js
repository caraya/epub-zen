var page_stack = [];
var oebps_dir = "";
var opf_file = "";
var ncx_file = "";
var abs_container_bottom = null;
var current_content_file = "";
var current_page = 0;
var num_chapters = 0;
var first_obscured_item = null;

function fade_content(a) {
    a.attr("class", "faded")
}
function load_content(a) {
    current_page = 0;
    var b = null;
    if (typeof a === "object") {
        page = $(this).attr("href");
        b = $(this)
    } else {
        page = a;
        b = $("a[href=" + a + "]")
    }
    current_content_file = page;
    document.location.hash = "#" + page;
    $(".selected").attr("class", "unselected");
    $(b).attr("class", "selected");
    $("#toc ol li").hide();
    if ($(b).parent().find("ol").length > 0) {
        $(b).parent().find("li").show()
    } else {
        $(b).parent().show();
        $(b).parent().siblings().show()
    }
    $("#content").load(page, null, process_content);
    var e = $("#toc a").index($(b));
    var c = e / num_chapters;
    var d = 500 * c;
    $("#book-remaining").css("width", d + "px");
    return false
}
function next_chapter() {
    var c = $("a.selected").parent();
    if (c.find("ol").length > 0) {
        c.find("li:first").find("a:first").click()
    } else {
        if (c.next("li").length === 0) {
            c.parent().parent().next("li").find("a:first").click()
        } else {
            c.next("li").find("a:first").click()
        }
    }
    var b = $("a.selected").position().top;
    var a = $("a.selected").height();
    if (b - (a * 2) > abs_container_bottom / 2) {
        $("#toc a:visible:eq(0)").hide()
    }
    first_hidden = $("#content :hidden:first");
    current_page = 0
}
function previous_chapter() {
    var a = $("a.selected").parent();
    if (a.prev("li").length === 0) {
        if (a.parent().parent().prev("li").length > 0) {
            a.parent().parent().find("a:first").click()
        }
    } else {
        a.prev("li").find("a:last").click()
    }
    $("#toc a:visible:eq(0)").parent().prev("li").find("a").show();
    $("#remaining").css("width", "0px")
}
function container(a) {
    opf_file = $(a).find("rootfile").attr("full-path");
    if (opf_file.indexOf("/") !== -1) {
        oebps_dir = opf_file.substr(0, opf_file.lastIndexOf("/"))
    }
    opf_file = epub_dir + "/" + opf_file;
    jQuery.get(opf_file, {}, opf)
}
function toc(b) {
    $(b).find("navPoint").each(function () {
        var e = $("<span/>").text($(this).find("text:first").text());
        var d = $("<a/>").attr("href", epub_dir + "/" + oebps_dir + "/" + $(this).find("content").attr("src"));
        page_stack.push(d.attr("href"));
        page_stack[d.attr("href")] = Array();
        e.appendTo(d);
        var c = $("<li/>");
        d.appendTo(c);
        if ($(this).find("navPoint").length > 0) {
            $('<ol class="part"/>').appendTo(c)
        }
        if ($(this).parent()[0].tagName.toLowerCase() == "navpoint") {
            c.appendTo('ol[class="part"]:last')
        } else {
            c.appendTo("#toc")
        }
        num_chapters++
    });
    $("#toc ol li").hide();
    if (document.location.hash) {
        var a = document.location.hash.replace("#", "");
        load_content(a)
    } else {
        $("#toc a:eq(0)").click()
    }
}
function opf(b) {
    var c = $(b).find("title");
    if (c) {
        c = c.text()
    }
    var a = $(b).find("creator");
    if (a) {
        a = a.text()
    }
    $("#content-title").html("<span class='title'>" + c + '</span> by <span class="author">' + a + "</span>");
    if (c || c === "") {
        $("#content-title").html("<span class='title'>" + $(b).find("dc\\:title").text() + '</span> by <span class="author">' + $(b).find("dc\\:creator").text() + "</span>")
    }
    var d = "opf\\:item";
    if ($(b).find("opf\\:item").length === 0) {
        d = "item"
    }
    $(b).find(d).each(function () {
        if ($(this).attr("href").indexOf(".ncx") !== -1) {
            ncx_file = epub_dir + "/" + oebps_dir + "/" + $(this).attr("href");
            jQuery.get(ncx_file, {}, toc)
        }
        if ($(this).attr("media-type") === "text/css") {
            var e = epub_dir + "/" + oebps_dir + "/" + $(this).attr("href");
            var f = $('<style type="text/css>').attr("id", $(this).attr("id"));
            $("head").append(f);
            f.load(e)
        }
    })
}
jQuery(document).ready(function () {
    ready();
});

function ready() {
    reset();
    jQuery.get(epub_dir + "/META-INF/container.xml", {}, container);
    $("#toc a").live("click", load_content);
    $("#book").resizable({
        alsoResize: "#content",
        stop: function () {
            reset();
            do_process()
        }
    });
//    $("#zg-form select").change(function () {
//        $("#zg-form").submit()
//    });
    $("#cover-anchor").click(load_content);
    $(document).bind("keydown", function (b) {
        var a = (b.keyCode ? b.keyCode : b.which);
        if (a === 78) {
            next()
        }
        if (a === 80) {
            previous()
        }
        if (a === 74) {
            next_chapter()
        }
        if (a === 75) {
            previous_chapter()
        }
    })
}

function process_content() {
    $("#book title").remove();
    $("#book link").remove();
    $("#book meta").remove();
    if ($("#content img").length > 0) {
        $("#content img:last").load(function () {
            do_process()
        })
    } else {
        do_process()
    }
}
function do_process() {
    abs_container_bottom = $("#book").height() + $("#book").offset().top;
    $("#content *").css("visibility", "hidden");
    $("#content").each(function () {
        draw(this)
    });
    if (page_stack[current_content_file] != null) {
        page_stack[current_content_file][current_page] = null
    }
    update_remaining()
}
var width_of_remaining = 200;

function update_remaining() {
    var d = 0;
    var j = null;
    var g = null;
    $("#content *:visible").each(function () {
        if ($(this).offset().top > $("#book").offset().top && ($(this).offset().top + $(this).height()) < ($("#book").offset().top + $("#book").height())) {
            if (!j) {
                j = $(this)
            }
            g = $(this);
            d += $(this).text().length
        }
    });
    var i = 0;
    $("#content *").each(function () {
        i += $(this).text().length
    });
    var c = 0;
    var e = $("#content *").index(j);
    var a = $("#content *").index(g);
    $("#content *:lt(" + e + ")").each(function () {
        c += $(this).text().length
    });
    var h = 0;
    $("#content *:gt(" + a + ")").each(function () {
        h += $(this).text().length
    });
    var k = width_of_remaining / h + c;
    var f = c / i;
    var b = width_of_remaining * f;
    if (c === 0) {
        b = 0
    }
    if (h === 0) {
        b = width_of_remaining
    }
    $("#remaining").css("width", b + "px")
}
var first_hidden = null;

function next() {
    if (first_hidden && first_hidden.length === 0) {
        first_hidden = null;
        return next_chapter()
    }
    $("#content *").each(function () {
        if ($(this).css("visibility") === "visible") {
            if ($(this).find("span:hidden").length === 0) {
                $(this).hide()
            }
        }
    });
    $("#content :visible").each(function () {
        draw(this)
    });
    current_page++;
    page_stack[current_content_file][current_page] = $("#content :hidden:last");
    var b = null;
    $("#content :visible").each(function () {
        if ($(this).css("visibility") === "visible") {
            b = $(this)
        }
    });
    var a = $("#content :visible").index(b);
    first_hidden = $("#content :visible:gt(" + a + "):first");
    update_remaining()
}
function previous() {
    if (current_page === 0) {
        return previous_chapter()
    }
    var d = page_stack[current_content_file][current_page];
    current_page--;
    var e = $("#content *").index(d);
    d.show();
    var b = [];
    $("#content *:gt(" + e + ")").each(function () {
        $(this).css("visibility", "hidden")
    });
    $("#content *:lt(" + e + ")").each(function () {
        b.push($(this))
    });
    b.reverse();
    var g = Math.floor(d.offset().top);
    var a = d.height();
    var c = g + a;
    for (var f = 0; f < b.length; f++) {
        b[f].show();
        if (b[f].height() === 0) {
            b[f].parents().show()
        }
        g = Math.floor(d.offset().top);
        a = d.height();
        c = g + a;
        if (c > abs_container_bottom) {
            b[f].hide();
            return false
        }
    }
    update_remaining()
}
function reset() {
    $('#content [class="inserted"]').each(function () {
        $(this).contents().appendTo($(this).prev());
        $(this).remove()
    })
    $('#content').empty();
    $('#toc').empty();
    page_stack = [];
    document.location.hash = '';
}
function draw(b) {
    var f = Math.floor($(b).offset().top);
    var h = $(b).height();
    var a = f + h;
    var d = null;
    var j = null;
    var c = false;
    if (a < abs_container_bottom) {
        $(b).css("visibility", "visible");
        $(b).find("*").css("visibility", "visible")
    } else {
        c = true
    }
    $(b).children().each(function () {
        f = Math.floor($(this).offset().top);
        h = $(this).height();
        a = f + h;
        if (a <= abs_container_bottom) {
            $(this).css("visibility", "visible");
            $(this).find("*").css("visibility", "visible")
        } else {
            draw(this);
            if (!d) {
                d = $(this);
                j = d
            }
            return
        }
    });
    if (c && !d) {
        d = $(b);
        j = $("<div>").html(d.html())
    }
    if (d) {
        f = Math.floor(d.offset().top);
        h = d.height();
        a = f + h;
        text_overflow = [];
        var e = -1;
        var g = parseInt($(d).css("line-height").replace("px", ""), 10);
        if (f < abs_container_bottom) {
            while (a > abs_container_bottom) {
                t = d.html();
                e = t.length - 1;
                while (e > 0 && t.charAt(e) !== " ") {
                    e--
                }
                text_overflow.push(t.substr(e, t.length));
                d.html(t.substr(0, e));
                if (e === 0) {
                    break
                }
                h = d.height();
                a = f + h
            }
        }
        if (d.text().length === 0) {
            $("#content").append(j);
            return
        }
        if (text_overflow.length > 0) {
            d.css("visibility", "visible");
            var i = $('<p class="inserted">').text(text_overflow.reverse().join(" "));
            i.css("visibility", "hidden");
            d.after(i)
        }
    }
};