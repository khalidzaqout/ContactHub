// ================= Elements =================
var contactModal = document.getElementById("contactModal");
var contactForm = document.getElementById("contactForm");
var modalTitle = document.getElementById("modalTitle");
var saveBtnText = document.getElementById("saveBtnText");

var nameInput = document.getElementById("contactName");
var phoneInput = document.getElementById("contactPhone");
var emailInput = document.getElementById("contactEmail");
var addressInput = document.getElementById("contactAddress");
var groupInput = document.getElementById("contactGroup");
var notesInput = document.getElementById("contactNotes");
var favoriteInput = document.getElementById("contactFavorite");
var emergencyInput = document.getElementById("contactEmergency");
var avatarInput = document.getElementById("avatarInput");
var avatarPreview = document.getElementById("avatarPreview");

var searchInput = document.getElementById("searchInput");
var contactsGrid = document.getElementById("contactsGrid");
var favoritesList = document.getElementById("favoritesList");
var emergencyList = document.getElementById("emergencyList");

// ================= State =================
var STORAGE_KEY = "contactHubContacts";
var contacts = [];
var editingId = null;
var currentAvatar = "";

var validationRules = {
  name: /^[a-zA-Z\u0600-\u06FF\s]{2,50}$/,
  phone: /^(\+20|0020|20)?0?1[0125][0-9]{8}$/,
  email: /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
};

var fields = [
  { input: nameInput, rule: validationRules.name, error: "contactNameError" },
  { input: phoneInput, rule: validationRules.phone, error: "contactPhoneError" },
  { input: emailInput, rule: validationRules.email, error: "contactEmailError" },
];

// ================= LocalStorage =================
function loadContacts() {
  var saved = localStorage.getItem(STORAGE_KEY);
  try {
    contacts = saved ? JSON.parse(saved) : [];
  } catch (e) {
    contacts = [];
  }
}

function saveContacts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch (e) {
    Swal.fire({
      icon: "error",
      title: "Storage Full",
      text: "Couldn't save your contacts. Try removing some contact photos.",
    });
  }
}

// ================= Helpers =================
function generateId() {
  return "c_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

function findContact(id) {
  for (var i = 0; i < contacts.length; i++) {
    if (contacts[i].id === id) return contacts[i];
  }
  return null;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getInitials(name) {
  var parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return parts[0].charAt(0).toUpperCase();
}

// "+201012345678", "00201012345678" and "01012345678" are the same number.
function normalizePhone(phone) {
  return phone.replace(/\D/g, "").slice(-10);
}

function buildAvatar(contact, size) {
  var sizeClass = size === "large" ? "avatar-lg" : "avatar-sm";
  if (contact.avatar) {
    return (
      '<img src="' + contact.avatar + '" alt="' + escapeHtml(contact.name) +
      '" class="avatar ' + sizeClass + '" />'
    );
  }
  var colorClass = "av-" + (contact.name.length % 8);
  return (
    '<div class="avatar ' + sizeClass + " " + colorClass + '">' +
    escapeHtml(getInitials(contact.name)) +
    "</div>"
  );
}

// ================= Modal =================
function openModal() {
  contactModal.classList.add("show");
  document.body.classList.add("modal-open");
  setTimeout(function () {
    nameInput.focus();
  }, 50);
}

function closeModal() {
  contactModal.classList.remove("show");
  document.body.classList.remove("modal-open");
  resetForm();
}

function resetForm() {
  contactForm.reset();
  editingId = null;
  currentAvatar = "";
  avatarInput.value = "";
  setAvatarPreview("");
  for (var i = 0; i < fields.length; i++) {
    clearFieldState(fields[i]);
  }
}

function setAvatarPreview(src, name) {
  if (src) {
    avatarPreview.innerHTML = '<img src="' + src + '" alt="Avatar" />';
  } else if (name) {
    avatarPreview.textContent = getInitials(name);
  } else {
    avatarPreview.innerHTML = '<i class="fa-solid fa-user"></i>';
  }
}

function openAddModal() {
  resetForm();
  modalTitle.textContent = "Add New Contact";
  saveBtnText.textContent = "Save Contact";
  openModal();
}

function openEditModal(id) {
  var contact = findContact(id);
  if (!contact) return;

  resetForm();
  editingId = id;
  currentAvatar = contact.avatar || "";

  modalTitle.textContent = "Edit Contact";
  saveBtnText.textContent = "Update Contact";
  nameInput.value = contact.name;
  phoneInput.value = contact.phone;
  emailInput.value = contact.email;
  addressInput.value = contact.address;
  groupInput.value = contact.group;
  notesInput.value = contact.notes;
  favoriteInput.checked = contact.isFavorite;
  emergencyInput.checked = contact.isEmergency;
  setAvatarPreview(currentAvatar, contact.name);

  openModal();
}

// Resized so photos stay small enough to fit in localStorage.
function handleAvatarChange(event) {
  var file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    Swal.fire({ icon: "error", title: "Invalid File", text: "Please choose an image file." });
    avatarInput.value = "";
    return;
  }

  var reader = new FileReader();
  reader.onload = function (e) {
    var img = new Image();
    img.onload = function () {
      var maxSize = 200;
      var scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      var canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      currentAvatar = canvas.toDataURL("image/jpeg", 0.85);
      setAvatarPreview(currentAvatar);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ================= Validation =================
function clearFieldState(field) {
  field.input.classList.remove("is-invalid", "is-valid");
  document.getElementById(field.error).classList.remove("show");
}

function validateField(field) {
  var value = field.input.value.trim();
  var errorEl = document.getElementById(field.error);

  if (value === "") {
    clearFieldState(field);
    return;
  }

  if (field.rule.test(value)) {
    field.input.classList.remove("is-invalid");
    field.input.classList.add("is-valid");
    errorEl.classList.remove("show");
  } else {
    field.input.classList.remove("is-valid");
    field.input.classList.add("is-invalid");
    errorEl.classList.add("show");
  }
}

function showError(title, text, input) {
  Swal.fire({ icon: "error", title: title, text: text, confirmButtonColor: "#7c3aed" }).then(
    function () {
      input.focus();
    }
  );
}

function validateForm(data) {
  if (!data.name) {
    showError("Missing Name", "Please enter a name for the contact!", nameInput);
    return false;
  }
  if (!validationRules.name.test(data.name)) {
    showError("Invalid Name", "Name should contain only letters and spaces (2-50 characters)", nameInput);
    return false;
  }
  if (!data.phone) {
    showError("Missing Phone", "Please enter a phone number!", phoneInput);
    return false;
  }
  if (!validationRules.phone.test(data.phone)) {
    showError(
      "Invalid Phone",
      "Please enter a valid Egyptian phone number (e.g., 01012345678 or +201012345678)",
      phoneInput
    );
    return false;
  }

  var newPhone = normalizePhone(data.phone);
  for (var i = 0; i < contacts.length; i++) {
    if (contacts[i].id !== editingId && normalizePhone(contacts[i].phone) === newPhone) {
      showError(
        "Duplicate Phone Number",
        "A contact with this phone number already exists: " + contacts[i].name,
        phoneInput
      );
      return false;
    }
  }

  if (data.email && !validationRules.email.test(data.email)) {
    showError("Invalid Email", "Please enter a valid email address", emailInput);
    return false;
  }
  return true;
}

// ================= CRUD =================
function handleSubmit(event) {
  event.preventDefault();

  var data = {
    name: nameInput.value.trim().replace(/\s+/g, " "),
    phone: phoneInput.value.trim(),
    email: emailInput.value.trim(),
    address: addressInput.value.trim(),
    group: groupInput.value,
    notes: notesInput.value.trim(),
    avatar: currentAvatar,
    isFavorite: favoriteInput.checked,
    isEmergency: emergencyInput.checked,
  };

  if (!validateForm(data)) return;

  var isEdit = editingId !== null;
  if (isEdit) {
    updateContact(editingId, data);
  } else {
    addContact(data);
  }

  closeModal();
  displayAll();

  Swal.fire({
    icon: "success",
    title: isEdit ? "Updated!" : "Added!",
    text: isEdit ? "Contact has been updated successfully." : "Contact has been added successfully.",
    timer: 1500,
    showConfirmButton: false,
  });
}

function addContact(data) {
  data.id = generateId();
  data.createdAt = new Date().toISOString();
  contacts.push(data);
  saveContacts();
}

function updateContact(id, data) {
  var contact = findContact(id);
  if (!contact) return;
  for (var key in data) {
    contact[key] = data[key];
  }
  saveContacts();
}

function deleteContact(id) {
  var contact = findContact(id);
  if (!contact) return;

  Swal.fire({
    title: "Delete Contact?",
    text: "Are you sure you want to delete " + contact.name + "? This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
  }).then(function (result) {
    if (!result.isConfirmed) return;

    contacts = contacts.filter(function (c) {
      return c.id !== id;
    });
    saveContacts();
    displayAll();

    Swal.fire({
      icon: "success",
      title: "Deleted!",
      text: "Contact has been deleted.",
      timer: 1500,
      showConfirmButton: false,
    });
  });
}

function toggleFavorite(id) {
  var contact = findContact(id);
  if (!contact) return;
  contact.isFavorite = !contact.isFavorite;
  saveContacts();
  displayAll();
  showToast(
    contact.isFavorite ? "Added to favorites" : "Removed from favorites",
    contact.isFavorite ? "success" : "info"
  );
}

function toggleEmergency(id) {
  var contact = findContact(id);
  if (!contact) return;
  contact.isEmergency = !contact.isEmergency;
  saveContacts();
  displayAll();
  showToast(
    contact.isEmergency ? "Marked as emergency contact" : "Removed from emergency contacts",
    contact.isEmergency ? "success" : "info"
  );
}

function showToast(title, icon) {
  Swal.fire({
    toast: true,
    position: "bottom-end",
    icon: icon,
    title: title,
    timer: 1600,
    showConfirmButton: false,
    timerProgressBar: true,
  });
}

// ================= Search =================
function getFilteredContacts() {
  var term = searchInput.value.trim().toLowerCase();
  if (!term) return contacts;

  var phoneTerm = term.replace(/[\s\-()]/g, "");
  return contacts.filter(function (c) {
    return (
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (phoneTerm !== "" && c.phone.includes(phoneTerm))
    );
  });
}

// ================= Display =================
function buildContactCard(c) {
  var name = escapeHtml(c.name);
  var phone = escapeHtml(c.phone);

  var favBadge = c.isFavorite
    ? '<span class="avatar-badge fav"><i class="fa-solid fa-star"></i></span>'
    : "";
  var emgBadge = c.isEmergency
    ? '<span class="avatar-badge emg"><i class="fa-solid fa-heart-pulse"></i></span>'
    : "";

  var emailRow = c.email
    ? '<div class="info-row"><span class="info-icon ic-violet"><i class="fa-solid fa-envelope"></i></span><span>' +
      escapeHtml(c.email) + "</span></div>"
    : "";
  var addressRow = c.address
    ? '<div class="info-row"><span class="info-icon ic-green"><i class="fa-solid fa-location-dot"></i></span><span>' +
      escapeHtml(c.address) + "</span></div>"
    : "";

  var groupTag = c.group
    ? '<span class="tag tag-' + escapeHtml(c.group) + '">' + escapeHtml(c.group) + "</span>"
    : "";
  var emgTag = c.isEmergency
    ? '<span class="tag tag-emergency"><i class="fa-solid fa-heart-pulse"></i> Emergency</span>'
    : "";
  var tags = groupTag || emgTag ? '<div class="d-flex flex-wrap gap-2 mt-3">' + groupTag + emgTag + "</div>" : "";

  var emailBtn = c.email
    ? '<a href="mailto:' + escapeHtml(c.email) + '" class="action-btn mail" title="Email"><i class="fa-solid fa-envelope"></i></a>'
    : "";

  return (
    '<div class="col-md-6">' +
      '<div class="contact-card">' +
        '<div class="card-content">' +
          '<div class="d-flex align-items-start gap-3">' +
            '<div class="avatar-wrapper">' + buildAvatar(c, "large") + favBadge + emgBadge + "</div>" +
            '<div class="flex-grow-1 pt-1" style="min-width:0">' +
              '<h3 class="contact-name" title="' + name + '">' + name + "</h3>" +
              '<div class="info-row mt-1"><span class="info-icon ic-blue"><i class="fa-solid fa-phone"></i></span><span>' + phone + "</span></div>" +
            "</div>" +
          "</div>" +
          (emailRow || addressRow ? '<div class="d-flex flex-column gap-2 mt-3">' + emailRow + addressRow + "</div>" : "") +
          tags +
        "</div>" +
        '<div class="card-actions">' +
          '<div class="d-flex gap-2">' +
            '<a href="tel:' + phone + '" class="action-btn call" title="Call"><i class="fa-solid fa-phone"></i></a>' +
            emailBtn +
          "</div>" +
          '<div class="d-flex gap-1">' +
            '<button class="action-btn fav' + (c.isFavorite ? " active" : "") + '" data-action="favorite" data-id="' + c.id + '" title="' + (c.isFavorite ? "Remove from favorites" : "Add to favorites") + '">' +
              '<i class="fa-' + (c.isFavorite ? "solid" : "regular") + ' fa-star"></i></button>' +
            '<button class="action-btn emg' + (c.isEmergency ? " active" : "") + '" data-action="emergency" data-id="' + c.id + '" title="' + (c.isEmergency ? "Remove from emergency" : "Mark as emergency") + '">' +
              '<i class="fa-' + (c.isEmergency ? "solid fa-heart-pulse" : "regular fa-heart") + '"></i></button>' +
            '<button class="action-btn edit" data-action="edit" data-id="' + c.id + '" title="Edit"><i class="fa-solid fa-pen"></i></button>' +
            '<button class="action-btn delete" data-action="delete" data-id="' + c.id + '" title="Delete"><i class="fa-solid fa-trash"></i></button>' +
          "</div>" +
        "</div>" +
      "</div>" +
    "</div>"
  );
}

function displayContacts() {
  var list = getFilteredContacts();

  if (list.length === 0) {
    var isSearching = contacts.length > 0;
    contactsGrid.innerHTML =
      '<div class="col-12 empty-state">' +
        '<div class="empty-icon"><i class="fa-solid ' + (isSearching ? "fa-magnifying-glass" : "fa-address-book") + '"></i></div>' +
        '<p class="title">' + (isSearching ? "No matching contacts" : "No contacts found") + "</p>" +
        '<p class="hint">' + (isSearching ? "Try a different name, phone, or email" : 'Click "Add Contact" to get started') + "</p>" +
      "</div>";
    return;
  }

  var html = "";
  for (var i = 0; i < list.length; i++) {
    html += buildContactCard(list[i]);
  }
  contactsGrid.innerHTML = html;
}

function buildSideItem(c, type) {
  return (
    '<div class="side-item ' + (type === "fav" ? "fav-item" : "emg-item") + '">' +
      buildAvatar(c, "small") +
      '<div class="side-item-info">' +
        "<h4>" + escapeHtml(c.name) + "</h4>" +
        "<p>" + escapeHtml(c.phone) + "</p>" +
      "</div>" +
      '<a href="tel:' + escapeHtml(c.phone) + '" class="side-call ' + (type === "fav" ? "green" : "red") + '" title="Call">' +
        '<i class="fa-solid fa-phone"></i></a>' +
    "</div>"
  );
}

function displaySideList(container, list, type, emptyText) {
  if (list.length === 0) {
    container.innerHTML = '<p class="side-empty">' + emptyText + "</p>";
    return;
  }
  var html = "";
  for (var i = 0; i < list.length; i++) {
    html += buildSideItem(list[i], type);
  }
  container.innerHTML = html;
}

function displayAll() {
  var favorites = contacts.filter(function (c) {
    return c.isFavorite;
  });
  var emergency = contacts.filter(function (c) {
    return c.isEmergency;
  });

  document.getElementById("totalCount").textContent = contacts.length;
  document.getElementById("favoritesCount").textContent = favorites.length;
  document.getElementById("emergencyCount").textContent = emergency.length;
  document.getElementById("contactsSubtitle").textContent =
    "Manage and organize your " + contacts.length + " contact" + (contacts.length === 1 ? "" : "s");

  displayContacts();
  displaySideList(favoritesList, favorites, "fav", "No favorites yet");
  displaySideList(emergencyList, emergency, "emg", "No emergency contacts");
}

// ================= Events =================
document.getElementById("addContactBtn").addEventListener("click", openAddModal);
document.getElementById("closeModalBtn").addEventListener("click", closeModal);
document.getElementById("cancelModalBtn").addEventListener("click", closeModal);

contactModal.addEventListener("click", function (e) {
  if (e.target === contactModal) closeModal();
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && contactModal.classList.contains("show") && !Swal.isVisible()) {
    closeModal();
  }
});

contactForm.addEventListener("submit", handleSubmit);
avatarInput.addEventListener("change", handleAvatarChange);
searchInput.addEventListener("input", displayContacts);

fields.forEach(function (field) {
  field.input.addEventListener("input", function () {
    validateField(field);
  });
});

contactsGrid.addEventListener("click", function (e) {
  var btn = e.target.closest("[data-action]");
  if (!btn) return;

  var id = btn.dataset.id;
  switch (btn.dataset.action) {
    case "favorite":
      toggleFavorite(id);
      break;
    case "emergency":
      toggleEmergency(id);
      break;
    case "edit":
      openEditModal(id);
      break;
    case "delete":
      deleteContact(id);
      break;
  }
});

// ================= Init =================
loadContacts();
displayAll();
