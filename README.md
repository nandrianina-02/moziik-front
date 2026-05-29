
```
Frontend
├─ createadmin.js
├─ dist
│  ├─ 404.html
│  ├─ assets
│  │  ├─ EnhancedDashboardView-Anxk8rcs.js
│  │  ├─ index-9wYqB4Gu.js
│  │  ├─ index-DHmmozTq.css
│  │  ├─ logo-BHAf0IDK.png
│  │  ├─ PublicProfileView-D0D1142W.js
│  │  └─ workbox-window.prod.es5-CLYUWRvB.js
│  ├─ favicon.svg
│  ├─ icon-192.png
│  ├─ icon-512.png
│  ├─ icons.svg
│  ├─ index.html
│  ├─ logo.png
│  ├─ manifest.webmanifest
│  ├─ sw.js
│  ├─ workbox-0280f04d.js
│  └─ _redirects
├─ eslint.config.js
├─ index.html
├─ lancer_dev.vbs
├─ netlify.toml
├─ package-lock.json
├─ package.json
├─ public
│  ├─ 404.html
│  ├─ favicon.svg
│  ├─ icon-192.png
│  ├─ icon-512.png
│  ├─ icons.svg
│  ├─ index.html
│  ├─ logo.png
│  ├─ sw.js
│  ├─ test.jsx
│  └─ _redirects
├─ README.md
├─ src
│  ├─ App.css
│  ├─ App.jsx
│  ├─ assets
│  │  ├─ hero.png
│  │  ├─ img
│  │  │  └─ game-board-bg.png
│  │  ├─ logo.png
│  │  ├─ react.svg
│  │  └─ vite.svg
│  ├─ components
│  │  ├─ FloatingInstallButton.jsx
│  │  ├─ layout
│  │  │  ├─ MoozikHeader.jsx
│  │  │  └─ MoozikRightPanel.jsx
│  │  ├─ modals
│  │  │  ├─ CreateAlbumModal.jsx
│  │  │  ├─ CreatePlaylistModal.jsx
│  │  │  ├─ ForgotPasswordModal.jsx
│  │  │  ├─ LoginModal.jsx
│  │  │  ├─ ResetPassword.jsx
│  │  │  ├─ ScheduledReleaseModal.jsx
│  │  │  ├─ UploadModal.jsx
│  │  │  └─ VerifyEmail.jsx
│  │  ├─ MonetisationComponents.jsx
│  │  ├─ MoozikNav.jsx
│  │  ├─ music
│  │  │  ├─ CommentsSection.jsx
│  │  │  ├─ LyricsDisplay.jsx
│  │  │  ├─ ReactionsBar.jsx
│  │  │  ├─ SongRow.jsx
│  │  │  └─ TimestampComments.jsx
│  │  ├─ player
│  │  │  ├─ constants
│  │  │  │  └─ eq.js
│  │  │  ├─ fullPlayer.css
│  │  │  ├─ FullPlayerPage.jsx
│  │  │  ├─ hooks
│  │  │  │  ├─ useAccentColor.js
│  │  │  │  ├─ useAutoQueue.js
│  │  │  │  ├─ useLocalAuth.js
│  │  │  │  ├─ usePlayerAnalytics.js
│  │  │  │  └─ useQueueDrag.js
│  │  │  ├─ index.js
│  │  │  ├─ MiniPlayerMobile.jsx
│  │  │  ├─ modals
│  │  │  │  ├─ ShareModal.jsx
│  │  │  │  └─ Toast.jsx
│  │  │  ├─ panels
│  │  │  │  ├─ CommentsPanel.jsx
│  │  │  │  ├─ EQPanel.jsx
│  │  │  │  ├─ InfosPanel.jsx
│  │  │  │  └─ QueuePanel.jsx
│  │  │  ├─ PlayerView.jsx
│  │  │  ├─ types
│  │  │  │  └─ player.js
│  │  │  └─ utils
│  │  │     └─ colorExtractor.js
│  │  ├─ RevenueComponents.jsx
│  │  ├─ social
│  │  │  └─ SocialFeatures.jsx
│  │  ├─ SocialComponents.jsx
│  │  └─ ui
│  │     ├─ ConfirmDialog.jsx
│  │     ├─ LoadingScreen.jsx
│  │     ├─ OfflineBanner.jsx
│  │     ├─ SessionExpiredToast.jsx
│  │     ├─ Skeletons.jsx
│  │     └─ UserGreeting.jsx
│  ├─ config
│  │  └─ api.js
│  ├─ hooks
│  │  ├─ useAuth.js
│  │  ├─ useDominantColor.js
│  │  ├─ useI18n.js
│  │  ├─ useInfiniteScroll.js
│  │  ├─ usePlayerQueue.js
│  │  ├─ usePushNotifications.js
│  │  ├─ usePWA.js
│  │  ├─ useRealtimeListeners.jsx
│  │  ├─ useSessionGuard.js
│  │  ├─ useSmartRecommendations.js
│  │  ├─ useSubscription.js
│  │  ├─ useTheme.js
│  │  └─ useTheme.jsx
│  ├─ index.css
│  ├─ index.html
│  ├─ main.jsx
│  ├─ types
│  │  └─ index.ts
│  └─ views
│     ├─ AccountView.jsx
│     ├─ AdminArtistView.jsx
│     ├─ AdminCertificationsView.jsx
│     ├─ AdminLibraryView.jsx
│     ├─ AdminTeamView.jsx
│     ├─ AlbumView.jsx
│     ├─ ArtistAnalyticsView.jsx
│     ├─ ArtistDashboard.jsx
│     ├─ ArtistsAdminView.jsx
│     ├─ ArtistsListView.jsx
│     ├─ ArtistView.jsx
│     ├─ DashboardView.jsx
│     ├─ EnhancedDashboardView.jsx
│     ├─ FavoritesView.jsx
│     ├─ GlobalSearchView.jsx
│     ├─ HomeView.jsx
│     ├─ MyAlbumsView.jsx
│     ├─ OfflineLibraryView.jsx
│     ├─ PlaylistView.jsx
│     ├─ PublicPlaylistsView.jsx
│     ├─ PublicProfileView.jsx
│     ├─ RadioView.jsx
│     ├─ SessionsView.jsx
│     ├─ SettingsView.jsx
│     ├─ SmartLinkPage.jsx
│     ├─ SubscriptionView.jsx
│     ├─ UserPlaylistView.jsx
│     └─ UsersAdminView.jsx
├─ tsconfig.json
└─ vite.config.js

```