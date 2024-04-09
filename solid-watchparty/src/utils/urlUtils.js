
/* TODO(Elias): Is this the correct way of doing this? Is it even guaranteed that the card is there and at that
 * location? */
export function getPodUrl(webId)
{
    let url = new URL(webId);
    url = url.origin + url.pathname;
    if (url.endsWith('/profile/card')) {
        url = url.substring(0, url.lastIndexOf('/profile/card'));
    } else if (url.includes('/profile/')) {
        url = url.substring(0, url.indexOf('/profile/'));
    }
    return url;
}

export function urlify(str)
{
	return str.toLowerCase().split(' ').join('-').replace(/[^a-zA-Z0-9-_]/g, '');
}

export function getDirectoryOfUrl(url)
{
    return url.split('/').slice(0, -1).join('/');
}
