#ifndef RAY_H
#define RAY_H

#include "vec3.h"

class my_ray {
    public:
        my_ray() {}

        my_ray(const my_point3 &_org, const my_vec3 &_dir): org(_org), dir(_dir) {} 

        my_point3 origin() const {
            return org;
        }
        
        my_vec3 direction() const {
            return dir;
        }

        my_point3 at(int t) const {
            return org + t*dir;
        }

    private:
        my_point3 org;
        my_vec3 dir;
};

#endif