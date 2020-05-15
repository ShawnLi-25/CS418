#ifndef _CS418_TEXTURE_H
#define _CS418_TEXTURE_H

#include <iostream>
#include "util.h"

class Texture  {
    public:
        virtual Vec3 value(double u, double v, const Vec3& p) const = 0;
};

//Solid Color
class Solid : public Texture {
    public:
        Solid() {}
        Solid(Vec3 c) : color_value(c) {}

        Solid(double r, double g, double b): Solid(Vec3(r, g, b)) {}

        Vec3 value(double u, double v, const Vec3& p) const {
            return color_value;
        }

    private:
        Vec3 color_value;
};

class CheckerTexture : public Texture {
    public:
        CheckerTexture() {}
        CheckerTexture(shared_ptr<Texture> t0, shared_ptr<Texture> t1): even(t0), odd(t1) {}

        Vec3 value(double u, double v, const Vec3& p) const {
            // Sign alternate to get checker pattern
            auto sign = sin(10 * p.x()) * sin(10 * p.y()) * sin(10 * p.z());
            if (sign < 0)
                return odd -> value(u, v, p);
            else
                return even -> value(u, v, p);
        }
        
    private:
        shared_ptr<Texture> odd;
        shared_ptr<Texture> even;
};

#endif
