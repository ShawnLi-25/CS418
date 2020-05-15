#ifndef _CS418_VEC3_H
#define _CS418_VEC3_H

#include <cmath>
#include <iostream>

using std::sqrt;

class Vec3 {
    public:
        Vec3() : e{0,0,0} {}
        Vec3(double e0, double e1, double e2) : e{e0, e1, e2} {}

        double x() const { return e[0]; }
        double y() const { return e[1]; }
        double z() const { return e[2]; }

        // double* getElements() const {
        //     return e;
        // }

        Vec3 operator+(const Vec3 &other) const {
            return Vec3(e[0] + other.e[0], e[1] + other.e[1], e[2] + other.e[2]);        
        }

        Vec3 operator-(const Vec3 &other) const {
            return Vec3(e[0] - other.e[0], e[1] - other.e[1], e[2] - other.e[2]);
        }

        Vec3 operator*(const Vec3 &other) {
            return Vec3(e[0] * other.e[0], e[1] * other.e[1], e[2] * other.e[2]);
        }
        
        Vec3 operator-() const { 
            return Vec3(-e[0], -e[1], -e[2]); 
        }

        double operator[](int i) const { return e[i]; }
        double& operator[](int i) { return e[i]; }

        Vec3& operator+=(const Vec3 &v) {
            e[0] += v.e[0];
            e[1] += v.e[1];
            e[2] += v.e[2];
            return *this;
        }

        Vec3& operator*=(const double t) {
            e[0] *= t;
            e[1] *= t;
            e[2] *= t;
            return *this;
        }

        Vec3& operator/=(const double t) {
            return *this *= 1/t;
        }

        double length() const {
            return sqrt(square_len());
        }

        double square_len() const {
            return e[0]*e[0] + e[1]*e[1] + e[2]*e[2];
        }

        void write_color(std::ostream &out, int samples_per_pixel) {
            // Replace NaN component values with zero.
            // See explanation in Ray Tracing: The Rest of Your Life.
            if (e[0] != e[0]) e[0] = 0.0;
            if (e[1] != e[1]) e[1] = 0.0;
            if (e[2] != e[2]) e[2] = 0.0;

            // Divide the color total by the number of samples and gamma-correct
            // for a gamma value of 2.0.
            auto scale = 1.0 / samples_per_pixel;
            auto r = sqrt(scale * e[0]);
            auto g = sqrt(scale * e[1]);
            auto b = sqrt(scale * e[2]);

            // Write the translated [0,255] value of each color component.
            out << static_cast<int>(256 * clamp(r, 0.0, 0.999)) << ' '
                << static_cast<int>(256 * clamp(g, 0.0, 0.999)) << ' '
                << static_cast<int>(256 * clamp(b, 0.0, 0.999)) << '\n';
        }

        inline static Vec3 random() {
            return Vec3(generate_random_double(), generate_random_double(), generate_random_double());
        }

        inline static Vec3 random(double min, double max) {
            return Vec3(generate_random_double(min, max), generate_random_double(min, max), generate_random_double(min, max));
        }

        double e[3];
};

inline std::ostream& operator<<(std::ostream &out, const Vec3 &v) {
    return out << v.e[0] << ' ' << v.e[1] << ' ' << v.e[2];
}

inline Vec3 operator*(double t, const Vec3 &v) {
    return Vec3(t*v.e[0], t*v.e[1], t*v.e[2]);
}

inline Vec3 operator*(const Vec3 &v, double t) {
    return t * v;
}

inline Vec3 operator/(Vec3 v, double t) {
    return (1/t) * v;
}

inline double dot(const Vec3 &u, const Vec3 &v) {
    return u.e[0] * v.e[0]
         + u.e[1] * v.e[1]
         + u.e[2] * v.e[2];
}

inline Vec3 cross(const Vec3 &u, const Vec3 &v) {
    return Vec3(u.e[1] * v.e[2] - u.e[2] * v.e[1],
                u.e[2] * v.e[0] - u.e[0] * v.e[2],
                u.e[0] * v.e[1] - u.e[1] * v.e[0]);
}

inline Vec3 unit_vector(Vec3 v) {
    return v / v.length();
}

// Util Function (can't fit in util.h)

Vec3 generate_random_unit_vec() {
    auto a = generate_random_double(0, 2 * PI);
    auto z = generate_random_double(-1, 1);
    auto r = sqrt(1 - z*z);
    return Vec3(r*cos(a), r*sin(a), z);
}

Vec3 generate_random_vec_sphere() {
    Vec3 p = Vec3::random(-1,1);
    while (p.square_len() >= 1) {
        p = Vec3::random(-1,1); 
    }
    return p;
}

Vec3 generate_random_vec_circle() {
    Vec3 p = Vec3(generate_random_double(-1,1), generate_random_double(-1,1), 0);
    while (p.square_len() >= 1) {
        p = Vec3(generate_random_double(-1,1), generate_random_double(-1,1), 0);
    }
    return p;
}

Vec3 reflect(const Vec3& v, const Vec3& n) {
    return v - 2*dot(v,n)*n;
}

Vec3 refract(const Vec3& uv, const Vec3& n, double etai_over_etat) {
    auto cos_theta = fmin(dot(-uv, n), 1.0);
    Vec3 r_out_parallel =  etai_over_etat * (uv + cos_theta*n);
    Vec3 r_out_perp = -sqrt(1.0 - r_out_parallel.square_len()) * n;
    return r_out_parallel + r_out_perp;
}

#endif
