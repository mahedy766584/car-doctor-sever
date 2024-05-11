/**
 * install jsonwebtoken
 * jwt.sing (payload, secret, {expiresIn:})
 * token client
 * 
 */

/**
 * how to store token in the client side
 * 1. memory --> ok type
 * 2. localStorage --> ok type (xss)
 * 3. cookies: http only
 * 
 */

/**
 * 1. set cookie with http only. for development secure: false,
 * 2. cors: => app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
 * 3. client side with axios settings
 */

/**
 * 1. to send cookies from the client make sure you added withCredential tru for the api call using axios
 * 2. use cookie parser as middleware
 */