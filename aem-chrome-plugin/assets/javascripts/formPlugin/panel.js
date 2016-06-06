/**
 * Created by gahuja on 5/21/2016.
 */

$(document).ready(function () {
    $('.tabbingPanel .tabLinkList a').on('click', function (e) {
        var divId = $(this).attr('href');
        $(divId).slideDown().siblings().slideUp();
        var $parent = $(this).parent('li');
        $parent.addClass('active').siblings().removeClass('active');
        e.preventDefault();
    });
});
