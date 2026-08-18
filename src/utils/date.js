function getPreviousWeekRange() {
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() - now.getDay());

  const start = new Date(end);
  start.setDate(end.getDate() - 6);

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}

function getPreviousMonthRange() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatFilenameDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}${minutes}`;
}

function isValidDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false;
  }

  if (start > end) {
    return false;
  }

  const diffDays = (end - start) / (1000 * 60 * 60 * 24);
  if (diffDays > 90) {
    return false;
  }

  return true;
}

module.exports = {
  getPreviousWeekRange,
  getPreviousMonthRange,
  formatDate,
  formatFilenameDate,
  isValidDateRange,
};
