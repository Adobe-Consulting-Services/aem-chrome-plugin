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

/** Replaces the jQuery-UI tabs widget with a small tab switcher using the markup's
 * existing active/inactive class convention (a <ul> of <li><a href="#paneId">) next
 * to a set of sibling panes carrying those ids). The CSS (panel.css/common.css) styles
 * the selected tab header via the "ui-tabs-active" class that jQuery-UI's widget used
 * to manage automatically - reproduce that here so the tab boxes still get their
 * selected-tab styling. **/
function selectTab(tabList, link) {
    tabList.querySelectorAll('.tabbed-pane-header-tab').forEach((tab) => {
        tab.classList.remove('ui-tabs-active');
    });
    const tabHeader = link.closest('.tabbed-pane-header-tab');
    if (tabHeader) {
        tabHeader.classList.add('ui-tabs-active');
    }

    const targetId = link.getAttribute('href').slice(1);
    const target = document.getElementById(targetId);
    if (!target) {
        return;
    }

    const paneParent = target.parentElement;
    Array.from(paneParent.children).forEach((pane) => {
        pane.classList.remove('active');
        pane.classList.add('inactive');
    });
    target.classList.remove('inactive');
    target.classList.add('active');
}

function initTabs(root) {
    root.querySelectorAll('.tabbed-pane-header-tabs').forEach((tabList) => {
        // Mark whichever tab's target pane is already "active" in the markup as selected.
        const initialLink = Array.from(tabList.querySelectorAll('a[href^="#"]')).find((link) => {
            const target = document.getElementById(link.getAttribute('href').slice(1));
            return target && target.classList.contains('active');
        });
        if (initialLink) {
            selectTab(tabList, initialLink);
        }

        tabList.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link || !tabList.contains(link)) {
                return;
            }
            e.preventDefault();
            selectTab(tabList, link);
        });
    });
}

function initVerticalDivider() {
    const divider = document.getElementById('vdivider');
    if (!divider) {
        return;
    }
    let dragOrigin;

    divider.addEventListener('mousedown', (e) => {
        e.preventDefault();
        dragOrigin = { x: e.pageX, y: e.pageY };
    });
    document.addEventListener('mousemove', (e) => {
        if (dragOrigin !== undefined) {
            resizeVerticalLayout(e, () => dragOrigin, (p0) => { dragOrigin = p0; });
        }
    });
    document.addEventListener('mouseup', () => {
        dragOrigin = undefined;
    });
}

function initHorizontalDivider() {
    const divider = document.getElementById('hdivider');
    if (!divider) {
        return;
    }
    let dragOrigin;

    divider.addEventListener('mousedown', (e) => {
        dragOrigin = { x: e.pageX, y: e.pageY };
    });
    document.addEventListener('mousemove', (e) => {
        if (dragOrigin !== undefined) {
            resizeHorizontalLayout(e, () => dragOrigin, (p0) => { dragOrigin = p0; });
        }
    });
    document.addEventListener('mouseup', () => {
        dragOrigin = undefined;
    });
}

function resizeVerticalLayout(e, getOrigin, setOrigin) {
    const requests = document.querySelector('.split-view-contents-requests');
    const details = document.querySelector('.split-view-contents-details');
    const p0 = getOrigin();
    const dx = e.pageX - p0.x;
    const MIN_REQUEST_WIDTH = 220;
    const MIN_DETAILS_WIDTH = 100;

    let newWidth = requests.getBoundingClientRect().width + dx;
    if (newWidth < MIN_REQUEST_WIDTH) {
        newWidth = MIN_REQUEST_WIDTH;
    }
    if (newWidth + MIN_DETAILS_WIDTH > window.innerWidth) {
        newWidth = window.innerWidth - MIN_DETAILS_WIDTH;
    }

    requests.style.width = newWidth + 'px';
    details.style.left = (newWidth - 1) + 'px';
    setOrigin({ x: newWidth });
}

function resizeHorizontalLayout(e, getOrigin, setOrigin) {
    const requests = document.querySelector('.split-view-contents-requests');
    const details = document.querySelector('.split-view-contents-details');
    const p0 = getOrigin();
    const dy = e.pageY - p0.y;

    let top = details.getBoundingClientRect().top + dy;
    if (top < 88) {
        top = 88;
    }
    if (window.innerHeight - top < 100) {
        top = window.innerHeight - 100;
    }

    requests.style.height = top + 'px';
    details.style.top = top + 'px';
    setOrigin({ y: top });
}

function initResponsiveLayout() {
    window.addEventListener('resize', () => {
        const splitView = document.querySelector('.split-view');
        const requests = document.querySelector('.split-view-contents-requests');
        const details = document.querySelector('.split-view-contents-details');

        if (window.innerWidth > 1050) {
            if (splitView.dataset.layout === 'horizontal') {
                requests.style.width = '481px';
                requests.style.height = '100%';
                details.style.left = '480px';
                details.style.top = '0';
            }
            splitView.dataset.layout = 'vertical';

            if (details.getBoundingClientRect().width < 200) {
                const newWidth = window.innerWidth - 200;
                requests.style.width = newWidth + 'px';
                details.style.left = (newWidth - 1) + 'px';
            }
        } else {
            if (splitView.dataset.layout === 'vertical') {
                requests.style.width = '100%';
                requests.style.bottom = '50%';
                requests.style.height = '50%';
                details.style.left = '0';
                details.style.top = '50%';
            }
            splitView.dataset.layout = 'horizontal';
        }
    });
}

export function initPanels() {
    initTabs(document);
    initHorizontalDivider();
    initVerticalDivider();
    initResponsiveLayout();

    document.querySelectorAll('.hide-onload').forEach((el) => el.classList.remove('hide-onload'));
}
