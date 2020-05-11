#ifndef VEC3_H
#define VEC3_H

#include <cmath>
#include <iostream>

using std::sqrt;

class my_vec3 {
    public:
        my_vec3() : e{0,0,0} {}
        my_vec3(double e0, double e1, double e2) : e{e0, e1, e2} {}

        double x() const { return e[0]; }
        double y() const { return e[1]; }
        double z() const { return e[2]; }

        double operator[](int i) const { return e[i]; }
        double& operator[](int i) { return e[i]; }
        
        my_vec3 operator-() const { return my_vec3(-e[0], -e[1], -e[2]); }

        my_vec3& operator+=(const my_vec3 &v) {
            e[0] += v.e[0];
            e[1] += v.e[1];
            e[2] += v.e[2];
            return *this;
        }

        my_vec3& operator*=(const double t) {
            e[0] *= t;
            e[1] *= t;
            e[2] *= t;
            return *this;
        }

        my_vec3& operator/=(const double t) {
            return *this *= 1/t;
        }

        double length() const {
            return sqrt(length_squared());
        }

        double length_squared() const {
            return e[0]*e[0] + e[1]*e[1] + e[2]*e[2];
        }

    public:
        double e[3];
};

// Type aliases for vec3
using my_point3 = my_vec3;   // 3D point
using my_color = my_vec3;    // RGB color

inline std::ostream& operator<<(std::ostream &out, const my_vec3 &v) {
    return out << v.e[0] << ' ' << v.e[1] << ' ' << v.e[2];
}

inline my_vec3 operator+(const my_vec3 &u, const my_vec3 &v) {
    return my_vec3(u.e[0] + v.e[0], u.e[1] + v.e[1], u.e[2] + v.e[2]);
}

inline my_vec3 operator-(const my_vec3 &u, const my_vec3 &v) {
    return my_vec3(u.e[0] - v.e[0], u.e[1] - v.e[1], u.e[2] - v.e[2]);
}

inline my_vec3 operator*(const my_vec3 &u, const my_vec3 &v) {
    return my_vec3(u.e[0] * v.e[0], u.e[1] * v.e[1], u.e[2] * v.e[2]);
}

inline my_vec3 operator*(double t, const my_vec3 &v) {
    return my_vec3(t*v.e[0], t*v.e[1], t*v.e[2]);
}

inline my_vec3 operator*(const my_vec3 &v, double t) {
    return t * v;
}

inline my_vec3 operator/(my_vec3 v, double t) {
    return (1/t) * v;
}

inline double dot(const my_vec3 &u, const my_vec3 &v) {
    return u.e[0] * v.e[0]
         + u.e[1] * v.e[1]
         + u.e[2] * v.e[2];
}

inline my_vec3 cross(const my_vec3 &u, const my_vec3 &v) {
    return my_vec3(u.e[1] * v.e[2] - u.e[2] * v.e[1],
                u.e[2] * v.e[0] - u.e[0] * v.e[2],
                u.e[0] * v.e[1] - u.e[1] * v.e[0]);
}

inline my_vec3 unit_vector(my_vec3 v) {
    return v / v.length();
}

#endif