(function () {
  function qs(id) {
    return document.getElementById(id);
  }

  function resolve(target) {
    return typeof target === "string" ? qs(target) : target;
  }

  function show(el) {
    const node = resolve(el);
    if (node) node.classList.remove("hidden");
  }

  function hide(el) {
    const node = resolve(el);
    if (node) node.classList.add("hidden");
  }

  function toggle(el, force) {
    const node = resolve(el);
    if (node) node.classList.toggle("hidden", force);
  }

  function setText(target, value) {
    const el = resolve(target);
    if (el) el.textContent = value ?? "";
  }

  function setHTML(target, value) {
    const el = resolve(target);
    if (el) el.innerHTML = value ?? "";
  }

  function setValue(target, value) {
    const el = resolve(target);
    if (el) el.value = value ?? "";
  }

  function setChecked(target, checked) {
    const el = resolve(target);
    if (el) el.checked = !!checked;
  }

  function on(target, eventName, handler, options) {
    const el = resolve(target);
    if (el) el.addEventListener(eventName, handler, options);
  }

  function off(target, eventName, handler, options) {
    const el = resolve(target);
    if (el) el.removeEventListener(eventName, handler, options);
  }

  function create(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  function hasClass(target, className) {
    const el = resolve(target);
    return !!el && el.classList.contains(className);
  }

  function isHidden(target) {
    return hasClass(target, "hidden");
  }

  function anyModalOpen() {
    const settingsOpen = !qs("settings-modal")?.classList.contains("hidden");
    const confirmOpen = !qs("confirm-modal")?.classList.contains("hidden");
    return !!(settingsOpen || confirmOpen);
  }

  function openModal(modalId) {
    show("overlay");
    show(modalId);
    document.body.style.overflow = "hidden";
  }

  function closeModal(modalId) {
    hide(modalId);

    if (!anyModalOpen()) {
      hide("overlay");
      document.body.style.overflow = "";
    }
  }

  function closeAllModals() {
    hide("settings-modal");
    hide("confirm-modal");
    hide("overlay");
    document.body.style.overflow = "";
  }

  window.DOM = {
    qs,
    resolve,
    show,
    hide,
    toggle,
    setText,
    setHTML,
    setValue,
    setChecked,
    on,
    off,
    create,
    hasClass,
    isHidden,
    anyModalOpen,
    openModal,
    closeModal,
    closeAllModals
  };
})();
