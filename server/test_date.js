const examDate = '2026-04-10T18:30:00.000Z';
const startTime = '10:40:00';
const endTime = '10:45:00';
const d = new Date(examDate);
const examDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const examStart = new Date(`${examDateStr}T${startTime}`);
const examEnd = new Date(`${examDateStr}T${endTime}`);
const now = new Date();

console.log('d:', d);
console.log('examDateStr:', examDateStr);
console.log('examStart:', examStart);
console.log('examEnd:', examEnd);
console.log('now:', now);
console.log('now < examStart:', now < examStart);
console.log('now > examEnd:', now > examEnd);
