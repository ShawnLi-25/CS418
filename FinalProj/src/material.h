#ifndef _CS418_MATERIAL_H
#define _CS418_MATERIAL_H

#include "util.h"
#include "texture.h"

// Forward Declaration
struct Intersection;

class Material {
    public:
        virtual bool scatter(const Ray& r_in, const Intersection& int_pt, Vec3& attenuation, Ray& scattered) const = 0;
};

class DiffuseMaterial : public Material {
    public:
        // Generate checker in diffuseMaterial
        DiffuseMaterial(shared_ptr<Texture> a) : albedo(a) {}

        virtual bool scatter(const Ray& r_in, const Intersection& int_pt, Vec3& attenuation, Ray& scattered) const  {
            Vec3 scatter_direction = int_pt.normal + generate_random_unit_vec();
            scattered = Ray(int_pt.point, scatter_direction);
            attenuation = albedo -> value(int_pt.u, int_pt.v, int_pt.point);
            return true;
        }

    private:
        shared_ptr<Texture> albedo; // Only support Solid color
};


class MetalMaterial : public Material {
    public:
        MetalMaterial(const Vec3& a, double f) : albedo(a), fuzz(f < 1 ? f : 1) {}

        virtual bool scatter(const Ray& r_in, const Intersection& int_pt, Vec3& attenuation, Ray& scattered) const {
            Vec3 reflected = reflect(unit_vector(r_in.direction()), int_pt.normal);
            scattered = Ray(int_pt.point, reflected + fuzz*generate_random_vec_sphere());
            attenuation = albedo;
            return (dot(scattered.direction(), int_pt.normal) > 0);
        }

    private:
        Vec3 albedo;
        double fuzz;
};

class DielectricsMaterial : public Material {
    public:
        DielectricsMaterial(double ri) : refractive_index(ri) {}

        virtual bool scatter(const Ray& r_in, const Intersection& int_pt, Vec3& attenuation, Ray& scattered) const {
            attenuation = Vec3(1.0, 1.0, 1.0);
            double etai_over_etat = (int_pt.is_front_face) ? (1.0 / refractive_index) : (refractive_index);

            Vec3 unit_direction = unit_vector(r_in.direction());
            double cos_theta = fmin(dot(-unit_direction, int_pt.normal), 1.0);
            double sin_theta = sqrt(1.0 - cos_theta*cos_theta);
            if (etai_over_etat * sin_theta > 1.0 ) {
                Vec3 reflected = reflect(unit_direction, int_pt.normal);
                scattered = Ray(int_pt.point, reflected);
                return true;
            }

            double reflect_prob = schlick(cos_theta, etai_over_etat);
            if (generate_random_double() < reflect_prob)
            {
                Vec3 reflected = reflect(unit_direction, int_pt.normal);
                scattered = Ray(int_pt.point, reflected);
                return true;
            }

            Vec3 refracted = refract(unit_direction, int_pt.normal, etai_over_etat);
            scattered = Ray(int_pt.point, refracted);
            return true;
        }
        
    private:
        double refractive_index;
};

#endif