module.exports = {
    LocalBlobProvider: require('./blob'),
    NullEmailProvider: require('./email'),
    MemoryCacheProvider: require('./cache'),
    MemoryPubSubProvider: require('./pubSub')
};
