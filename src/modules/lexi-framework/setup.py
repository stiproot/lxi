from setuptools import setup, find_packages

# metadata...
name = "lxi_framework"
description = ""
author = "Simon Stipcich"
author_email = "usr@lxi.com"
url = ""
license = "MIT"
keywords = ["python", "package", "beta"]
version = "0.0.1"

with open("README.md", "r", encoding="utf-8") as f:
    long_description = f.read()

# dependencies...
install_requires = []

# setup...
setup(
    name=name,
    version=version,
    packages=find_packages(where="src"),
    package_dir={"lxi_framework": "src/lxi_framework"},
    description=description,
    long_description=long_description,
    long_description_content_type="text/markdown",
    author=author,
    author_email=author_email,
    url=url,
    license=license,
    keywords=keywords,
    install_requires=install_requires,
    classifiers=[
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.11",
    ],
)
