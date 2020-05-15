#ifndef _CS418_CAMERA_H
#define _CS418_CAMERA_H

#include "util.h"

// View (basic function: emit_ray)
class Camera {
    public:
        Camera() : Camera(Vec3(0,0,-1), Vec3(0,0,0), Vec3(0,1,0), 40, 1, 0, 10) {}

        Camera(Vec3 eye_pt, Vec3 view_dir, Vec3 up, double fov, double aspect_ratio, double aperture, double focal_len) {
            origin = eye_pt;
            lens_radius = aperture / 2;

            auto theta = deg_to_rad(fov);
            auto half_height = tan(theta/2);
            auto half_width = aspect_ratio * half_height;

            w = unit_vector(eye_pt - view_dir);
            u = unit_vector(cross(up, w));
            v = cross(w, u);

            lower_left_corner = origin - half_width*focal_len*u - half_height*focal_len*v - focal_len*w;

            horizontal = 2 * half_width * focal_len * u;
            vertical = 2 * half_height * focal_len * v;
        }

        Ray emit_ray(double s, double t) const {
            Vec3 rd = lens_radius * generate_random_vec_circle();
            Vec3 offset = u * rd.x() + v * rd.y();
            return Ray(origin + offset, lower_left_corner + s * horizontal + t * vertical - origin - offset);
        }

    private:
        Vec3 origin;
        Vec3 lower_left_corner;
        Vec3 horizontal;
        Vec3 vertical;
        Vec3 u, v, w;
        double lens_radius;
};

#endif
