import { List } from '../types';

export const MOCK_LISTS: List[] = [
    {
        id: '1',
        name: 'To Watch',
        createdAt: Date.now(),
        sharedWith: ['Alex', 'Jamie'],
        items: [
            {
                id: '101',
                tmdbId: 27205,
                title: 'Inception',
                posterPath: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
                releaseYear: '2010',
                mediaType: 'movie',
                overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life.',
            },
            {
                id: '102',
                tmdbId: 157336,
                title: 'Interstellar',
                posterPath: '/gEU2QniL6E77NI6lCU6MxlNBvIx.jpg',
                releaseYear: '2014',
                mediaType: 'movie',
            },
        ],
    },
    {
        id: '2',
        name: 'Weekend Favorites',
        createdAt: Date.now() - 100000,
        isShared: true,
        ownerName: 'Alice',
        items: [
            {
                id: '201',
                tmdbId: 1399,
                title: 'Game of Thrones',
                posterPath: '/u3bZgnGQ9T01sWNhy95hfwUw6Q.jpg',
                releaseYear: '2011',
                mediaType: 'tv',
                rating: 5,
                isWatched: true,
            },
            {
                id: '202',
                tmdbId: 680,
                title: 'Pulp Fiction',
                posterPath: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
                releaseYear: '1994',
                mediaType: 'movie',
                addedBy: 'charlie@example.com',
                watchedBy: [],
                ratings: { 'charlie@example.com': 4 },
            },
        ],
        sharedWith: ['charlie@example.com'],
    },
];
