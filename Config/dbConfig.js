/**
 * Created by cl-desktop31 on 19/5/16.
 */
'use strict';

if (process.env.NODE_ENV == 'dev') {
    exports.config = {
        PORT : 8000,
         dbURI : 'mongodb://fitghostDev:503e8cea98320594fc748ffea34bb201@localhost/fitghostDev'
    }
}/* else if (process.env.NODE_ENV == 'test') {
    exports.config = {
        PORT : 8001,
      dbURI : 'mongodb://fitghostTest:2385130731c2b6ff16d880caa3c27a48@localhost/fitghostTest'
    }
} else if (process.env.NODE_ENV == 'live') {
    exports.config = {
        PORT : 8002,
        dbURI : 'mongodb://thapliyalshivam:crednets1996@52.86.124.174/admin'
    }
}*/
else {

    exports.config = {
        PORT : 8000,
        dbURI : 'mongodb://thapliyal:shivam@localhost/admin'
    };
}
