# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.

from django.conf import settings
from django.urls import include, path
from django.utils.module_loading import import_string

from wagtail import urls as wagtail_urls
from wagtail.admin import urls as wagtailadmin_urls
from watchman import views as watchman_views

from bedrock.base import views as base_views

# The default django 404 and 500 handler doesn't run the ContextProcessors,
# which breaks the base template page. So we replace them with views that do!
handler500 = "bedrock.base.views.server_error_view"
handler404 = "bedrock.base.views.page_not_found_view"
locale404 = "lib.l10n_utils.locale_selection"


urlpatterns = (
    # Main pages
    path("foundation/", include("bedrock.foundation.urls")),
    path("about/legal/", include("bedrock.legal.urls")),
    path("press/", include("bedrock.press.urls")),
    path("privacy/", include("bedrock.privacy.urls")),
    path("products/", include("bedrock.products.urls")),
    path("security/", include("bedrock.security.urls")),
    path("", include("bedrock.firefox.urls")),
    path("", include("bedrock.mozorg.urls")),
    path("", include("bedrock.newsletter.urls")),
    path("", include("bedrock.sitemaps.urls")),
    path("careers/", include("bedrock.careers.urls")),
    path("landing/", include("bedrock.landing.urls")),
    path("stories/", include("bedrock.stories.urls")),
    path("healthz/", watchman_views.ping, name="watchman.ping"),
    path("readiness/", watchman_views.status, name="watchman.status"),
    path("healthz-cron/", base_views.cron_health_check),
)

if settings.DEV:
    urlpatterns += (
        # Add /404-locale/ for localizers.
        path("404-locale/", import_string(locale404)),
    )

if settings.DEBUG:
    urlpatterns += (
        path("404/", import_string(handler404)),
        path("500/", import_string(handler500)),
    )

if settings.WAGTAIL_ENABLE_ADMIN:
    urlpatterns += (path("cms-admin/", include(wagtailadmin_urls)),)

if settings.DEFAULT_FILE_STORAGE == "django.core.files.storage.FileSystemStorage":
    # Serve media files from Django itself - production won't use this
    from django.urls import re_path
    from django.views.static import serve

    urlpatterns += (
        re_path(
            r"^user-media/(?P<path>.*)$",
            serve,
            {"document_root": settings.MEDIA_ROOT},
        ),
    )
    # Note that statics are handled via Whitenoise's middleware


# Wagtail is the catch-all route, and it will raise a 404 if needed
urlpatterns += (path("", include(wagtail_urls)),)
