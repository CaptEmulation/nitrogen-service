App.findWithAdapter = function(query, nitrogenModel, emberModel) {

    var promise = $.Deferred();
    nitrogenModel.find(App.session, query, function(err, nitrogenModels) {
        if (err) return promise.reject(err);

        var emberModels = nitrogenModels.map(function(modelObject) {
            return emberModel.create(modelObject);
        });

        promise.resolve(emberModels);
    });

    return promise;
};