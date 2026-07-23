if (update.bar) {
  let updateReady = false;

  window.dashboardAPI.onUpdateStatus((data) => {
    switch (data.status) {
      case 'checking':
        update.text.textContent =
          getTranslation('update_checking') || 'Checking for updates...';
        update.bar.className = 'update-status';
        update.progress.classList.add('hidden');
        update.installBtn.classList.add('hidden');
        break;

      case 'available':
        const ver = data.info ? data.info.version : '';
        update.text.textContent =
          getTranslation('update_available') + ' (v' + ver + ')';
        update.bar.className = 'update-status available';
        updateReady = false;
        update.installBtn.classList.remove('hidden');
        update.installBtn.querySelector('span').textContent =
          getTranslation('update_download_btn') || 'Download';
        showToast(
          getTranslation('update_available') || 'Update available',
          'v' + ver,
        );

        break;

      case 'not-available':
        update.text.textContent =
          getTranslation('update_current') || 'You are up to date';
        update.bar.className = 'update-status current';
        update.progress.classList.add('hidden');
        update.installBtn.classList.add('hidden');

        break;

      case 'downloading':
        update.bar.className = 'update-status downloading';
        update.text.textContent =
          (getTranslation('update_downloading') || 'Downloading') +
          ' ' +
          Math.round(data.progress.percent) +
          '%';
        update.progress.classList.remove('hidden');
        update.progressFill.style.width = data.progress.percent + '%';
        update.installBtn.classList.add('hidden');

        break;

      case 'downloaded':
        update.bar.className = 'update-status downloaded';
        update.text.textContent =
          getTranslation('update_downloaded') || 'Update ready to install';
        update.progress.classList.add('hidden');
        updateReady = true;
        update.installBtn.classList.remove('hidden');
        update.installBtn.querySelector('span').textContent =
          getTranslation('update_install_btn') || 'Restart & Install';

        break;

      case 'installing':
        update.bar.className = 'update-status downloading';
        update.text.textContent =
          getTranslation('update_aur_installing') || 'Installing via pacman...';
        update.progress.classList.add('hidden');
        update.installBtn.classList.add('hidden');

        break;

      case 'error':
        update.bar.className = 'update-status error';
        update.text.textContent =
          getTranslation('update_error') || 'Could not check for updates';
        update.progress.classList.add('hidden');
        update.installBtn.classList.add('hidden');

        break;
    }
  });

  update.checkBtn.addEventListener('click', () => {
    window.dashboardAPI.checkForUpdates();
  });

  update.installBtn.addEventListener('click', () => {
    if (updateReady) {
      window.dashboardAPI.quitAndInstall().catch((err) => {
        update.text.textContent =
          (getTranslation('update_error') || 'Update failed') +
          ': ' +
          err.message;

        update.bar.className = 'update-status error';
        update.installBtn.classList.remove('hidden');
      });
    } else {
      update.installBtn.classList.add('hidden');
      window.dashboardAPI.downloadUpdate().catch((err) => {
        update.text.textContent =
          (getTranslation('update_error') || 'Download failed') +
          ': ' +
          err.message;

        update.bar.className = 'update-status error';
        update.installBtn.classList.remove('hidden');
      });
    }
  });
}
