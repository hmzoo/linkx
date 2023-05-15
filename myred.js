const Redis = require("ioredis");

const host = process.env.REDIS_HOST || 'localhost'
const port = process.env.REDIS_PORT || 6379
const prefix = process.env.REDIS_PREFIX || "LINKX"



const redis = new Redis({
    host: host,
    port: port,
});


console.log("REDIS HOST :", host + ":" + port, "\nREDIS PREFIX : ", prefix);


redis.on("connect", () => {
    console.log("REDIS STATUS :", redis.status);
});
redis.on("error", (err) => {
    console.log("REDIS STATUS :", redis.status);
    console.log("REDIS ERROR", err.code)
    console.log("TERMINATED ...", err.code)
    process.exit(1);
})


redis.flushall();


const ttl = 60 * 60 * 24;
const rankey = () => { return "" + (100000 + Math.floor(Math.random() * 900000)); }
const pf = (k) => { return prefix + k }


//UTILS
// CREATE KEY 
let create_key = (uid, key) => {
    redis.del("data_" + pf(key));
    redis.del("flw_" + pf(key));
    redis.del("sec_" + pf(key));
    redis.set("sec_" + pf(key), 0, 'ex', ttl);
    return redis.set("uid_" + pf(key), uid, 'ex', ttl)
}
// REMOVE KEY and LINKS
let delete_key = (key) => {
    redis.exists("fwl_" + pf(key)).then(ans => {
        if (ans != 1) {
            redis.smembers("fwl_" + pf(key)).then(keys => {
                for (let i = 0; i < keys.length; i++) {
                    redis.exists("fwl_" + pf(keys[i])).then(ans => {
                        if (ans != 1) {
                            redis.srem("fwl_" + pf(keys[i]), key);
                        }
                    })
                }
            })
        }
    })

    redis.del("uid_" + pf(key));
    redis.del("data_" + pf(key));
    redis.del("flw_" + pf(key));
    redis.del("sec_" + pf(key));

}

// NEW LINK

let create_link = (key, qkey) => {
 
    redis.exists("fwl_" + pf(key)).then(ansk => {
        if (ansk != 1 && key != qkey) {
            redis.smembers("fwl_" + pf(qkey)).then(qkeys => {
                let skeys = qkeys.filter(function(value){ return value != key });
                redis.smembers("fwl_" + pf(key)).then(keys => {

                    
                    skeys.push(qkey);

                    redis.sadd("fwl_" + pf(key), skeys).then(a=>{
                        for (let i = 0; i < keys.length; i++) {
                            if(!qkeys.contains(key[i])){
                                create_link(keys[i],qkey)
                            }
                        }
                    })






            redis.exists("fwl_" + pf(qkey)).then(ansq => {
                if (ansq != 1 ) {
                    redis.smembers("fwl_" + pf(qkey)).then(qkeys => {
                        redis.sadd("fwl_" + pf(key), qkeys).then(a=>
                            redis.smembers("fwl_" + pf(key)).then( keys => {
                                let test = keys.includes( qkey);

                                for (let i = 0; i < keys.length; i++) {
                                    let skeys = keys.filter(function(value, index, arr){ return value != keys[i] });
                                    skeys.push(key);
                                    redis.sadd("fwl_" + pf(keys[i]), skeys)
                                }
            
                            })
                            
                            



            
        }
    })
}





const myred = {
    new_key: (uid, n = 1000) => {

        if (n < 0) { redis.flushall(); return { key: "", data: [], msg: "No free key !!" }; }
        const key = rankey();

        return redis.exists("uid_" + pf(key)).then(ans => {

            if (ans == 1) {
                return myred.new_key(uid, n - 1);
            } else {
                return create_key(uid, key).then(ans => { return myred.json_data(key, "Your key is " + key) });

                /*
                return redis.sadd("fwl_" + key, key).then(rep=>{
                    let msg="Your key is "+key;
                    return redis.set("uid_" + key, uid, 'ex', ttl).then(ans => { return myred.json_data(key,msg) });
                }) 
                */
            }
        })
    },
    check_key: (key, uid) => {
        if (key && uid) {
            return redis.get("uid_" + pf(key)).then(ans => ans == uid)
        } else {
            return Promise.resolve(false);
        }
    },
    reset_key: (key) => {
        redis.del("uid_" + pf(key));
        redis.del("data_" + pf(key));
        redis.del("flw_" + pf(key));
        redis.del("sec_" + pf(key));
    },
    set_data: (key, val) => {
        let msg = "";
        if (val) { msg = "Sharing"; } else { msg = "Not sharing" }
        return redis.set("data_" + pf(key), val, 'ex', ttl).then(r => { return myred.json_data(key, msg) });
    },
    add_key: (key, qkey) => {
        if (key == qkey) { return myred.json_data(key, "you are " + key) }
        return redis.get("sec_" + pf(key)).then(cpt => {
            if (cpt < 50) {
                return redis.exists("uid_" + pf(qkey)).then(ans => {

                    let msg = "";
                    if (ans) {
                        msg = qkey + " added";
                        redis.sadd("fwl_" + pf(qkey), key);
                        return redis.sadd("fwl_" + pf(key), qkey).then(r => { return myred.json_data(key, msg) })
                    } else {
                        redis.incr("sec_" + pf(key))
                        msg = "nobody at " + qkey + " !!";
                        return myred.json_data(key, msg)
                    }
                })
            } else {
                msg = "nobody at " + qkey + " !!";
                return myred.json_data(key, msg)
            }
        })
    },
    clean_keys: (key) => {
        return redis.smembers("fwl_" + pf(key)).then(keys => {
            for (let i = 0; i < keys.length; i++) {
                let k = keys[i]
                redis.exists("uid_" + pf(k)).then(ans => {
                    if (ans != 1) {
                        redis.srem("fwl_" + pf(key), k);
                    }
                })

            }
            return myred.json_data(key, "")
        })

    },
    json_err: { key: "", fwl: [], msg: "ERR" },
    json_data: (key, msg) => {
        let resp = { key: key, fwl: [], msg: msg };
        return redis.exists("fwl_" + pf(key)).then(ans => {
            if (ans == 1) {

                return redis.smembers("fwl_" + pf(key)).then(keys => {

                    if (keys && keys.length > 0) {
                        const fwl_keys = keys.map(element => {
                            return "data_" + pf(element);
                        });

                        return redis.mget(fwl_keys).then(data => {

                            for (let i = 0; i < keys.length; i++) {
                                resp.fwl.push({ k: keys[i], d: data[i] || "" })
                            }
                            return resp;
                        })
                    } else {
                        return resp;
                    }
                })

            } else {
                return resp;
            }
        })

    }


}







module.exports = myred;