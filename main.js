const Apify = require('apify');

Apify.main(async () => {
    const input = await Apify.getInput();
    const hotelName = input.hotelName;
const searchUrl = `https://www.lastminutky.sk/vyhladavanie-zajazdov/1/?q=${encodeURIComponent(hotelName)}`;

    const requestQueue = await Apify.openRequestQueue();
    await requestQueue.addRequest({ url: searchUrl, userData: { type: 'search' } });

    const imageUrls = [];

    const crawler = new Apify.CheerioCrawler({
        requestQueue,
        handlePageFunction: async ({ request, $ }) => {
            if (request.userData.type === 'search') {
                const hotelLink = $('a.card-title').attr('href');
                if (hotelLink) {
                    const fullUrl = \`https://www.lastminutky.sk\${hotelLink}\`;
                    await requestQueue.addRequest({ url: fullUrl, userData: { type: 'detail' } });
                }
            } else if (request.userData.type === 'detail') {
                $('img').each((index, el) => {
                    const src = $(el).attr('data-src') || $(el).attr('src');
                    if (src && imageUrls.length < 4 && src.match(/^https?:\/\/.*\.(jpg|jpeg|png)$/)) {
                        imageUrls.push(src);
                    }
                });
            }
        },
        maxRequestsPerCrawl: 10,
    });

    await crawler.run();
    await Apify.setValue('OUTPUT', { images: imageUrls });
});
