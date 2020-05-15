#ifndef _CS418_UTIL_H
#define _CS418_UTIL_H

#include <cstdlib>
#include <limits>
#include <memory>
#include <cmath>

using std::shared_ptr;
using std::make_shared;
using std::sqrt;

inline double deg_to_rad(double degrees) {
    return degrees * PI / 180.0;
}

inline double clamp(double x, double min, double max) {
    if (x < min) return min;
    if (x > max) return max;
    return x;
}
inline double generate_random_double() {
    return rand() / (RAND_MAX + 1.0);
}

// Returns a random double in [min,max).
inline double generate_random_double(double min, double max) {
    return min + (max-min) * generate_random_double();
}

// Returns a random int in [min,max).
int generate_random_int(int min, int max) {
    return rand() % (max - min) + min;
}

double schlick(double cosine, double ref_idx) {
    auto r0 = (1 - ref_idx) / (1 + ref_idx);
    r0 = pow(r0, 2);
    return r0 + (1 - r0) * pow((1 - cosine), 5);
}

// Basic-class Headers (should be included ahead)
#include "ray.h"
#include "vec3.h"

#endif
