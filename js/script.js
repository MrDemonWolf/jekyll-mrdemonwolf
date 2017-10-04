// Fixs the menu so when link is clicked it would close the menu.
$(function () {

    $('#bs-example-navbar-collapse-1')
        .on('shown.bs.collapse', function () {
            $('#navbar-hamburger').addClass('hidden');
            $('#navbar-close').removeClass('hidden');
        })
        .on('hidden.bs.collapse', function () {
            $('#navbar-hamburger').removeClass('hidden');
            $('#navbar-close').addClass('hidden');
        });

});

$(document).on('click', '.navbar-collapse.in', function (e) {
    if ($(e.target).is('a') && $(e.target).attr('class') != 'dropdown-toggle') {
        $(this).collapse('hide');
    }
});
$(function () {
    $(document).click(function (event) {
        $('.navbar-collapse').collapse('hide');
    });
});
// Contact us effect for when clicked into the form.
$('.js-input').keyup(function () {
    if ($(this).val()) {
        $(this).addClass('not-empty');
    } else {
        $(this).removeClass('not-empty');
    }
});
$(document).ready(function () {
    $(".fancybox").fancybox({
        openEffect: "none",
        closeEffect: "none"
    });
});


$(document).ready(function () {
    setTimeout(function () {
        $("#cookieConsent").fadeIn(200);
    }, 4000);
    $("#closeCookieConsent, .cookieConsentOK").click(function () {
        $("#cookieConsent").fadeOut(200);
    });
}); 
// Project Gallery
$(document).ready(function () {

    $(".project_gallery_filter-button").click(function () {
        var value = $(this).attr('data-filter');

        if (value == "all") {
            //$('.filter').removeClass('hidden');
            $('.filter').show('1000');
        }
        else {
            //            $('.filter[filter-item="'+value+'"]').removeClass('hidden');
            //            $(".filter").not('.filter[filter-item="'+value+'"]').addClass('hidden');
            $(".filter").not('.' + value).hide('3000');
            $('.filter').filter('.' + value).show('3000');

        }
    });

    if ($(".project_gallery_filter-button").removeClass("active")) {
        $(this).removeClass("active");
    }
    $(this).addClass("active");

});