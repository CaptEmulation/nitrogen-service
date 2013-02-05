module.exports = function() {
    switch(process.env.NODE_ENV){
        case 'production':
            return {
            	mongodb_url: "mongodb://localhost/magenta",
            	http_port: 80
           	};

        case 'test':
        	return {
            	mongodb_url: "mongodb://localhost/magenta_test",
            	http_port: 3050
        	};

        default: 
        case 'development':
            return {
            	mongodb_url: "mongodb://localhost/magenta_dev",
            	http_port: 3030
        	};
    }
};