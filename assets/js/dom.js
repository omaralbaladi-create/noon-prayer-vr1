(function () {
  function qs(id) {
    return document.getElementById(id);
  }

  function show(el) {
    const node = typeof el === "string" ? qs(el) : el;
    if (node) node.classList.remove("hidden");
  }

  function hide(el) {
    const node = typeof el === "string" ? qs(el) : el;
    if (node) node.classList.add("hidden");
  }

  function setText(target, value) {
    const el = typeof target === "string" ? qs(target) : target;
    if (el) el.textContent = value ?? "";
  }

  function setHTML(target, value) {
    const el = typeof target === "string" ? qs(target) : target;
    if (el) el.innerHTML = value ?? "";
  }

  function on(target, eventName, handler, options) {
    const el = typeof target === "string" ? qs(target) : target;
    if (el) el.addEventListener(eventName, handler, options);
  }

  function openModal(modalId) {
    show("overlay");
    show(modalId);
    document.body.style.overflow = "hidden";
  }

  function closeModal(modalId) {
    hide(modalId);

    const settingsOpen = !qs("settings-modal")?.classList.contains("hidden");
    const confirmOpen = !qs("confirm-modal")?.classList.contains("hidden");

    if (!settingsOpen && !confirmOpen) {
      hide("overlay");
      document.body.style.overflow = "";
    }
  }

  function toggle(el, force) {
    const node = typeof el === "string" ? qs(el) : el;
    if (node) node.classList.toggle("hidden", force);
  }

  function create(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  window.DOM = {
    qs,
    show,
    hide,
    setText,
    setHTML,
    on,
    openModal,
    closeModal,
    toggle,
    create
  };
})();
