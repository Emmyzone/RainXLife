document.addEventListener('DOMContentLoaded', () => {
  const addBtn = document.getElementById('add-lesson-btn');
  const container = document.getElementById('lessons-container');
  const template = document.getElementById('lesson-row-template');

  if (addBtn && container && template) {
    addBtn.addEventListener('click', () => {
      const clone = template.content.cloneNode(true);
      const label = clone.querySelector('.lesson-row-label');
      const count = container.querySelectorAll('.lesson-row').length + 1;
      if (label) label.textContent = `Lesson ${count}`;
      container.appendChild(clone);
    });
  }
});
