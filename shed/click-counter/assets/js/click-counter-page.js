(function () {
    document.querySelectorAll('details').forEach((item) => {
        item.addEventListener('toggle', () => {
            if (!item.open) return;
            document.querySelectorAll('details[open]').forEach((other) => {
                if (other !== item) other.open = false;
            });
        });
    });
})();
