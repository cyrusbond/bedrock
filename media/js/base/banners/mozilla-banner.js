/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Create namespace
if (typeof window.Mozilla === 'undefined') {
    window.Mozilla = {};
}

(function () {
    'use strict';
    var _pageBanner;

    var Banner = {};

    Banner.hasConsentCookie = function () {
        var prefCookieID = 'moz-consent-pref';
        try {
            if (window.Mozilla.Cookies.hasItem(prefCookieID)) {
                var pref = JSON.parse(
                    window.Mozilla.Cookies.getItem(prefCookieID)
                );
                return pref.functional;
            }
            return false;
        } catch (e) {
            return false;
        }
    };

    Banner.setCookie = function (id) {
        // only set functional cookie if consent has been given.
        if (!Banner.hasConsentCookie()) {
            return;
        }

        var date = new Date();
        var cookieDuration = 1 * 24 * 60 * 60 * 1000; // 1 day expiration
        date.setTime(date.getTime() + cookieDuration); // 1 day expiration
        Mozilla.Cookies.setItem(
            id,
            true,
            date.toUTCString(),
            '/',
            undefined,
            false,
            'lax'
        );
    };

    Banner.hasCookie = function (id) {
        return Mozilla.Cookies.hasItem(id);
    };

    Banner.close = function () {
        // Remove the banner from the DOM.
        _pageBanner.parentNode.removeChild(_pageBanner);

        // Set a cookie to not display it again.
        Banner.setCookie(Banner.id);

        // UA
        window.dataLayer.push({
            event: 'in-page-interaction',
            eLabel: 'Banner Dismissal',
            'data-banner-name': Banner.id,
            'data-banner-dismissal': '1'
        });
        // GA4
        window.dataLayer.push({
            event: 'widget_action',
            type: 'banner',
            action: 'dismiss',
            name: Banner.id
        });
    };

    Banner.show = function (renderAtTopOfPage) {
        var outerWrapper = document.getElementById('outer-wrapper');

        // if for some reason there's no outer-wrapper on the page, do nothing.
        if (!outerWrapper) {
            return;
        }

        // remove banner from bottom of page.
        _pageBanner = _pageBanner.parentNode.removeChild(_pageBanner);

        // reinsert at the top of viewport, else after primary nav.
        if (renderAtTopOfPage) {
            document.body.insertBefore(_pageBanner, document.body.firstChild);
        } else {
            outerWrapper.insertBefore(_pageBanner, outerWrapper.firstChild);
        }

        // display the banner
        _pageBanner.classList.add('c-banner-is-visible');

        // GA4
        window.dataLayer.push({
            event: 'widget_action',
            type: 'banner',
            action: 'display',
            name: Banner.id,
            non_interaction: true
        });

        // wire up close button
        _pageBanner
            .querySelector('.c-banner-close')
            .addEventListener('click', Banner.close, false);
    };

    Banner.init = function (id, renderAtTopOfPage) {
        var cookiesEnabled =
            typeof Mozilla.Cookies !== 'undefined' && Mozilla.Cookies.enabled();

        _pageBanner = document.getElementById(id);

        /**
         * If the banner does not exist on a page,
         * or there's not a valid banner ID then do nothing.
         */
        if (!_pageBanner || typeof id !== 'string') {
            return false;
        }

        Banner.id = id;

        // Show only if cookies enabled & banner not previously dismissed.
        if (cookiesEnabled && !Banner.hasCookie(Banner.id)) {
            Banner.show(renderAtTopOfPage);
        }
    };

    window.Mozilla.Banner = Banner;
})();
