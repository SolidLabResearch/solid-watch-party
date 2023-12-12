
export function displayDate(date) {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.getDate() === now.getDate() &&
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear();

    const isYesterday = date.getDate() === yesterday.getDate() &&
                        date.getMonth() === yesterday.getMonth() &&
                        date.getFullYear() === yesterday.getFullYear();

    const zeroPad = (num) => num < 10 ? '0' + num : num;

    if (isToday) {
        return `Today at ${zeroPad(date.getHours())}:${zeroPad(date.getMinutes())}`;
    } else if (isYesterday) {
        return `Yesterday at ${zeroPad(date.getHours())}:${zeroPad(date.getMinutes())}`;
    } else {
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ` +
               `${zeroPad(date.getHours())}:${zeroPad(date.getMinutes())}`;
    }
}

