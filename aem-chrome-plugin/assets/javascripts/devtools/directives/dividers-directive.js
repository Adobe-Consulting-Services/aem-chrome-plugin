/*
 * #%L
 * AEM Chrome Plug-in
 * %%
 * Copyright (C) 2016 Adobe
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */

angular.module('aem-chrome-plugin-app')

.directive('aemChromePluginPanels', function() {
  return function(scope, element, attrs) {

    var initDividers = function() {
      $("#aemPluginTab").tabs();
      $('#tabs').tabs();
      $('.stupidtable').stupidtable();
      // key('⌘+k, ctrl+l', function(){ panel.clearData(scope) });

      that = this;
      initHorizontalDivider();
      initVerticalDivider();
      window.onresize = function(e) {
        if (window.innerWidth > 1050) {
          if ($('.split-view').data('layout') == 'horizontal') {
            $('.split-view-contents-requests').css({'width': '481px', 'height': '100%'});
            $('.split-view-contents-details').css({'left': '480px', 'top':'0'});
          }
          $('.split-view').data('layout', 'vertical');

          // if details panel is too small, resize requests panel instead
          if ($('.split-view-contents-details').width() < 600) {
            newWidth = window.innerWidth - 600;
            $('.split-view-contents-requests').width(newWidth);
            $('.split-view-contents-details').css({'left': newWidth - 1 + 'px'});
          }


        } else {
          if ($('.split-view').data('layout') == 'vertical') {
            $('.split-view-contents-requests').css({'width': '100%', 'bottom': '50%', 'height': '50%'});
            $('.split-view-contents-details').css({'left': '0', 'top':'50%'});
          }
          $('.split-view').data('layout', 'horizontal');
        }
      };
    };

    var initVerticalDivider = function() {
      that = this;
      $(document).on('mousedown', '#vdivider', function(e) {
        e.originalEvent.preventDefault(); // http://stackoverflow.com/a/9743380
        $(this).data('p0', { x: e.pageX, y: e.pageY });
      });
      $(document).on('mousemove', function(e) {
        var p0 = $('#vdivider').data('p0');
        if (p0 !== undefined) {
          resizeVerticalLayout(e);
        }
      });
      $(document).on('mouseup', function(e) {
        $('#vdivider').removeData();
      });
    };

    var initHorizontalDivider = function() {
      that = this;
      $(document).on('mousedown', '#hdivider', function(e) {
        $(this).data('p0', { x: e.pageX, y: e.pageY });
      });
      $(document).on('mousemove', function(e) {
        var p0 = $('#hdivider').data('p0');
        if (p0 !== undefined) {
          resizeHorizonalLayout(e);
        }
      });
      $(document).on('mouseup', function(e) {
        $('#hdivider').removeData();
      });
    };

    var resizeVerticalLayout = function(e) {
      var p0 = $('#vdivider').data('p0');
      var p1 = { x: e.pageX};
      var dx = p1.x - p0.x;

      var currentWidth = $('.split-view-contents-requests').width();
      var newWidth = currentWidth + dx;
      var currentLeft = $('.split-view-contents-details').position().left;
      if (newWidth < 462) {
        newWidth = 462;
      }
      if (newWidth + 600 > window.innerWidth) {
        newWidth = window.innerWidth - 600;
      }
      $('.split-view-contents-requests').width(newWidth);
      $('.split-view-contents-details').css({'left': newWidth - 1 + 'px'});
      $('#vdivider').data('p0', { x: newWidth });
    };

    var resizeHorizonalLayout = function(e) {
      var p0 = $('#hdivider').data('p0');
      var p1 = { y: e.pageY};
      var dy = p1.y - p0.y;
      var top = $('.split-view-contents-details').position().top + dy;
      if (top < 88) {
        top = 88;
      }
      if (window.innerHeight - top < 100) {
        top = window.innerHeight - 100;
      }
      $('.split-view-contents-requests').css({'height':top + 'px'});
      $('.split-view-contents-details').css({'top':top + 'px'});
      $('#hdivider').data('p0', { y: top });
    };

    initDividers();
    // Hack to remove the overlay flicker
    $('.hide-onload').removeClass('hide-onload');
  };
});
