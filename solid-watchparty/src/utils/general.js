
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

export function stringToColor(str) {
    // (c) https://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript
    let hash = 0;
    str.split('').forEach(char => {
        hash = char.charCodeAt(0) + ((hash << 5) - hash)
    })
    let color = '#'
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff
        color += value.toString(16).padStart(2, '0')
    }
    return color;
}

