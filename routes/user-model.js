var mongoose = require("mongoose"),
		Schema = mongoose.Schema,
		scrypt = require("scrypt"),
		bcrypt = require("bcrypt"),
		maxtime = 0.1,
		SALT_WORK_FACTOR = 10,
		UserSchema,
		oauthAccessToken,
		oauthAccessTokenSecret,
		edamShard,
		edamUserId,
		edamExpires,
		edamNoteStoreUrl,
		edamWebApiUrlPrefix;

//if (req.session.oauthAccessToken)
	//oauthAccessToken = req.session.oauthAccessToken;
//if (req.session.oauthAccessTokenSecret)
	//oauthAccessTokenSecret =  req.session.oauthAccessTokenSecret;
//if (req.session.edamShard)
	//edamShard =  req.session.edamShard;
//if (req.session.edamUserId)
	//edamUserId =  req.session.edamUserId;
//if (req.session.edamExpires)
	//edamExpires =  req.session.edamExpires;
//if (req.session.edamNoteStoreUrl)
	//edamNoteStoreUrl =  req.session.edamNoteStoreUrl;
//if (req.session.edamWebApiUrlPrefix)
	//edamWebApiUrlPrefix =  req.session.edamWebApiUrlPrefix;


	UserSchema = new Schema({
		email: { type: String, required: true, index: { unique: true } },
						 password: { type: String, required: true },
						 oauthAccessToken: { type: String, required: true },
						 oauthAccessTokenSecret: { type: String },
						 edamShard: { type: String, required: true }, 
						 edamUserId: { type: String, required: true },
						 edamExpires: { type: String, required: true },
						 edamNoteStoreUrl: { type: String, required: true },
						 edamWebApiUrlPrefix: { type: String, required: true }

	});

UserSchema.pre('save', function(next) {
	var user = this;

	// only hash the password if it has been modified (or is new)
	//if (!user.isModified('password')) return next();
	//scrypt.passwordHash('password', maxtime, function(err, pwdhash) {
		//if (!err) {
			//pwdhash should now be stored in the database
			//user.password = pwdhash;
			//next();
		//}
	//});
	
	// generate a salt
	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		if (err) return next(err);

		// hash the password using our new salt
		bcrypt.hash(user.password, salt, function(err, hash) {
			if (err) return next(err);

			console.log('hashed password is: ', hash);
			// override the cleartext password with the hashed one
			user.password = hash;
			next();
		});
	});
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
		//var o = this.password;
		//console.log('o: ', o);
		//console.log('candidatePassword: ', candidatePassword);
	//scrypt.verifyHash(o, candidatePassword, function(err, result) {
		//console.log('2nd o: ', o);
		//if (err)
			//console.log('Error: ', err);
		//if (!err)
			//return cb(null, result); //Will be True
		//else
			//return cb(err, result);
	//return cb(err);    
	//});
//}

	bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
		if (err) return cb(err);
		cb(null, isMatch);
	});
}

module.exports = mongoose.model('User', UserSchema);
